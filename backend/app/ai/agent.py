import json
import asyncio
import httpx
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logger import logger
from app.ai.tools import TOOLS
from app.ai.tool_executor import ToolExecutor
from app.ai.prompts import SYSTEM_PROMPT

class PlanifyAgent:
    def __init__(self):
        self.api_key = settings.get_ai_api_key
        self.model = settings.AI_MODEL
        self.base_url = "https://api.groq.com/openai/v1"

    async def chat(
        self,
        user_id: int,
        messages: List[Dict[str, Any]],
        db: AsyncSession,
        user_timezone: str = "Asia/Ho_Chi_Minh"
    ) -> Dict[str, Any]:
        """
        Execute an agent turn with tool calling loop.
        """
        if not self.api_key:
            return {
                "content": "⚠️ Khóa API Groq chưa được cấu hình. Vui lòng thêm AI_API_KEY vào biến môi trường hệ thống.",
                "tool_calls": None,
                "tool_results": None
            }

        executor = ToolExecutor(user_id=user_id, db=db)
        system_msg = {
            "role": "system",
            "content": SYSTEM_PROMPT.format(
                current_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                user_timezone=user_timezone
            )
        }

        # Truncate conversation history to last 20 messages for context safety
        truncated_history = messages[-20:] if len(messages) > 20 else messages
        llm_messages = [system_msg] + truncated_history

        try:
            # First LLM call
            response_msg = await self._call_groq(llm_messages)
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return {
                "content": "Xin lỗi, hiện tại tôi gặp sự cố kết nối tới dịch vụ AI. Bạn vui lòng thử lại sau giây lát! 🙏",
                "tool_calls": None,
                "tool_results": None
            }

        tool_calls = response_msg.get("tool_calls")
        if not tool_calls:
            return {
                "content": response_msg.get("content", ""),
                "tool_calls": None,
                "tool_results": None
            }

        # Execute tool calls
        tool_results = []
        executed_tools_summary = []

        for tc in tool_calls:
            tool_name = tc["function"]["name"]
            try:
                raw_args = tc["function"].get("arguments") or "{}"
                tool_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                if not isinstance(tool_args, dict):
                    tool_args = {}
            except Exception as ex:
                logger.warning(f"Malformed tool call arguments for '{tool_name}': {ex}")
                tool_args = {}
            logger.info(f"Agent calling tool '{tool_name}' with args {tool_args}")

            result = await executor.execute(tool_name, tool_args)
            executed_tools_summary.append({
                "tool": tool_name,
                "arguments": tool_args,
                "result": result
            })

            tool_results.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": json.dumps(result, ensure_ascii=False)
            })

        # Append assistant turn and tool results to continue reasoning
        llm_messages.append(response_msg)
        llm_messages.extend(tool_results)

        try:
            final_response = await self._call_groq(llm_messages)
            return {
                "content": final_response.get("content", ""),
                "tool_calls": executed_tools_summary,
                "tool_results": tool_results
            }
        except Exception as e:
            logger.error(f"Error in second Groq turn: {e}")
            return {
                "content": "Tôi đã thực hiện thao tác theo yêu cầu của bạn thành công! ✅",
                "tool_calls": executed_tools_summary,
                "tool_results": tool_results
            }

    async def _call_groq(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "tools": TOOLS,
            "tool_choice": "auto",
            "temperature": 0.2,
            "max_tokens": 1024
        }

        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 429 and attempt < 2:
                        logger.warning(f"Groq API 429 rate limit hit, retry attempt {attempt + 1}...")
                        await asyncio.sleep(2.0 * (attempt + 1))
                        continue
                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < 2:
                    await asyncio.sleep(2.0 * (attempt + 1))
                    continue
                raise
            except httpx.RequestError as e:
                if attempt < 2:
                    await asyncio.sleep(1.0)
                    continue
                raise

planify_agent = PlanifyAgent()


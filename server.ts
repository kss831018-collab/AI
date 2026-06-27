import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = 3000;

// Gemini API 초기화
const defaultAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API 키 유효성 검사 API
app.post("/api/validate-key", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({ success: false, error: "API 키가 입력되지 않았거나 올바르지 않은 형식입니다." });
    }

    const testAi = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // 간단한 모델 호출 테스트로 유효성 확인
    const response = await testAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "API validation check. Please reply only 'OK'.",
    });

    if (response && response.text) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, error: "API 응답이 올바르지 않습니다." });
    }
  } catch (error: any) {
    console.error("Key Validation Error:", error);
    const errStr = error?.message || "";
    let errMsg = "입력하신 API 키가 유효하지 않습니다. 우측 상단의 'Google AI Studio에서 키 발급받기' 링크를 통해 새로운 API 키를 발급받아 등록해 주세요.";
    
    if (errStr.includes("API key not valid") || errStr.includes("INVALID_ARGUMENT") || errStr.includes("API_KEY_INVALID") || errStr.includes("not found")) {
      errMsg = "입력하신 API 키가 유효하지 않습니다. 우측 상단의 'Google AI Studio에서 키 발급받기' 링크를 통해 새로운 API 키를 발급받아 등록해 주세요.";
    } else if (errStr) {
      // If it contains other error patterns, make it helpful but readable
      errMsg = `입력하신 API 키 검증에 실패했습니다. 올바른 키인지 확인하시거나 새로운 키를 발급받아 등록해 주세요. (오류 메시지: ${errStr})`;
    }
    return res.status(400).json({ success: false, error: errMsg });
  }
});

// AI 분석 및 진행 API
app.post("/api/analyze", async (req, res) => {
  try {
    const { step, messages, filesContent, currentStatus, counselorNotes } = req.body;
    
    // 헤더에서 사용자 정의 API 키 추출
    const userApiKey = req.headers["x-gemini-api-key"] as string;
    const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKeyToUse) {
      return res.status(400).json({ error: "Gemini API 키가 등록되지 않았습니다. 랜딩페이지에서 API 키를 등록해 주세요." });
    }

    const requestAi = new GoogleGenAI({
      apiKey: apiKeyToUse,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let systemInstruction = `당신은 국민취업지원제도에 참여한 구직자의 맞춤형 희망직종 탐색 및 선택을 지원하는 베테랑 직업상담 전문가입니다. 
사용자가 단계별로 업로드하는 구직자의 기초자료 파일(입사지원서, 이력서, 자기소개서, 경력기술서, 경험리스트, 직업심리검사 결과 등)과 상담 정보를 종합 분석하여, 참여자가 스스로 최적의 희망직종을 찾고 결정할 수 있도록 이끌어주는 역할을 수행합니다.

이 대화는 3단계 데이터 수집 프로세스(Step 1 ~ Step 3)를 거쳐 최종 2단계 종합 분석 결과를 출력하는 절차를 밟습니다.
절대로 첫 대화부터 최종 리포트를 만들거나 2개 이상의 단계를 한 번에 질문하지 마십시오. 오직 사용자의 답변 및 파일 업로드를 확인한 후 순차적으로 한 단계씩만 진행해야 합니다.

[1단계: 데이터 수집 프로세스 (Multi-turn)]
* Step 1: 사용자가 "참여자 기초자료 파일"을 전달합니다. (텍스트 또는 파일 내용)
  - 입력 데이터를 접수하면, 주요 키워드(학력, 경력 등)를 짧게 확인/요약해주며, 다음 단계로 친절하게 넘어가 'Step 2: 참여자의 현재 상황 정보'를 정중히 질문하십시오.
  - 질문 항목 예시: 현재 희망직종 유무 및 미선택 사유, 하고 싶은 일/싫은 일, 자신 있는 일/없는 일, 근무조건, 건강상 제한, 운전 여부, 가족상황, 취업 시 가장 중요하게 생각하는 조건 등.
* Step 2: 사용자가 "현재 상황 정보"를 입력합니다.
  - 입력된 현재 상황을 접수했음을 알리고, 요약해주며 다음 단계인 'Step 3: 상담자가 기록한 1회기 상담내용 메모'를 정중히 요청하십시오.
  - 요청 항목 예시: 상담 중 관찰한 특징, 의사소통 방식, 직업/현실 인식 수준, 자신감, 취업의지, 직업정보 수준, 직업선택을 방해하는 요인, 상담자의 의견 등.
* Step 3: 사용자가 "1회기 상담내용 메모"를 입력합니다.
  - 이 데이터까지 모두 수집 완료되면, 즉시 [2단계: 종합 분석 및 최종 출력 프로세스]를 실행하여 reportData 객체의 각 탭 내용을 가득 채워 최종 도출해야 합니다.

[2단계: 종합 분석 및 최종 출력 프로세스 (Step 3 완료 시 필수 출력)]
상담사가 Step 3의 입력까지 완료하여 모든 데이터가 제공되면, 수집된 모든 데이터를 매핑하여 다음 항목들을 'reportData' 필드에 빈틈없이 명확하게 작성합니다. 어떠한 항목도 '생략'하거나 '이하 생략', '위와 같음'으로 얼버무리지 말고 전문가 수준의 구체적 텍스트로 가득 채워주십시오.

1. reportData.tab1_profile:
   - '참여자 기초자료 분석 (가)': 학력, 경력, 직무경험, 자격증, 교육이수, 직무역량, 강점, 약점, 반복 업무, 성취경험, 대인관계 특성, 업무스타일을 항목별로 명확히 정리.
   - '현재 상황 및 상담내용 분석 (나, 다)': 구직 성향 및 상담사 관찰 특징 통합 분석.
   - '직업프로파일 작성 (라)': ①핵심 강점, ②핵심 역량, ③흥미분야, ④직업가치관, ⑤성격특성, ⑥선호 업무환경, ⑦적응 가능한 조직문화, ⑧직업선택 시 장애요인, ⑨보완해야 할 역량, ⑩상담 시 반드시 고려해야 하는 사항 등 10가지 항목 상세 기술.

2. reportData.tab2_recommendation:
   - '맞춤형 희망직종 추천 (마)': 1~3순위 직종 선정 및 상세 분석[추천 이유, 적합 근거, 활용 가능 경험, 부족 역량, 보완방법, 취업가능성(상/중/하)]. [추가 도전 직종]과 [현실적 빠른 취업 직종] 구분 제시.
   - '의사결정 비교표 작성 (사)': 적합도, 취업가능성, 성장성, 임금수준, 난이도, 업무환경, 워라밸, 필요역량, 준비기간, 직업훈련 필요성 10가지 기준을 비교한 가독성 높은 마크다운 표 및 종합 추천 이유 기술.

3. reportData.tab3_tools:
   - '상담 질문지 생성 (바)': 개방형, 가치관 탐색, 경험 회상, 강점 발견, 직업선택 질문을 '각각 10개 이상(총 50개 이상)' 생략 없이 온전하고 구체적인 문장으로 작성. (질문 번호를 1번부터 50번까지 모두 나열할 것!)
   - '상담 스크립트 작성 (자)': 아래 7가지 구체적 상황에 대해 각각 [공감 -> 질문 -> 피드백 -> 동기부여 -> 행동계획] 5단계 시나리오를 생략 없이 생생한 대화체로 모두 전개.
     * 상황 1: 전직에 대한 두려움이 가득하여 새로운 직종 도전을 망설이는 참여자
     * 상황 2: 본인의 능력 대비 지나치게 높은 눈높이의 대기업/고소득 직무만 고집하는 참여자
     * 상황 3: 오랜 경력단절로 인해 구직 자신감이 완전히 상실되어 소극적인 참여자
     * 상황 4: 직업인식이 아예 부족하여 어떤 일이 본인에게 맞는지 모르는 무경험 참여자
     * 상황 5: 잦은 이직과 퇴사 반복으로 장기근속 의지가 약해 보이는 참여자
     * 상황 6: 건강/가족 돌봄 제한으로 특정 시간대 및 지역 조건만 고집해야 하는 제약 있는 참여자
     * 상황 7: 취업 의지 자체가 낮고 타성에 젖어 국민취업지원제도 수당 수령만을 목적으로 참여하는 참여자
   - '미확정자 추가 탐색전략 (아)': 직무체험, 내일배움카드 훈련, 일경험 프로그램 등을 활용한 구체적 단계별 실행계획 수립.

4. reportData.tab4_report:
   - '최종 종합리포트 출력 (차)': 국민취업지원제도 상담기록 양식에 맞춘 전문가 수준의 최종 종합 리포트 마크다운 구조화 텍스트. (다운로드 및 서류 제출이 즉시 가능하도록 완벽하게 서식을 갖출 것. 국민취업지원제도 공식 현장 용어 '일경험 프로그램', '국민내일배움카드' 등을 정확히 사용)

모든 답변 시 정중하고 전문적인 한국어 존댓말을 사용해 주십시오.`;

    // 대화 컨텍스트 구성
    let contents: any[] = [];
    
    // 이전 대화 기록 전달
    if (messages && messages.length > 0) {
      contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    }

    // 현재 단계 정보 및 입력 추가
    let prompt = "";
    if (step === 1) {
      prompt = `[사용자 입력 - 참여자 기초자료]
파일 내용 또는 전달 텍스트:
${filesContent || "(내용 없음)"}

위 기초자료를 접수하여 핵심 키워드(학력, 경력 등)를 짧게 확인/요약해주고, Step 2의 '참여자의 현재 상황 정보' 질문을 정중하고 친근하게 던져주세요.`;
    } else if (step === 2) {
      prompt = `[사용자 입력 - 참여자 현재 상황]
${JSON.stringify(currentStatus, null, 2)}

위 현재 상황 정보를 접수했음을 알리고 주요 요인을 요약해준 뒤, Step 3의 '상담자가 기록한 1회기 상담내용 메모'를 정중하게 요청해 주세요.`;
    } else if (step === 3) {
      prompt = `[사용자 입력 - 1회기 상담내용 메모]
${JSON.stringify(counselorNotes, null, 2)}

모든 정보(참여자 기초자료, 현재 상황, 1회기 상담내용 메모)가 완벽하게 수집되었습니다! 
이제 약속한 대로 [2단계: 종합 분석 및 최종 출력 프로세스]를 즉각 수행해 주세요.
reportData 객체의 tab1_profile, tab2_recommendation, tab3_tools, tab4_report 필드를 절대 생략 없이 온전하고 방대한 텍스트로 가득 채워서 완성해 주십시오.
상담 질문지 50개는 절대 생략 없이 1번부터 50번까지 다 적어야 하며, 상황별 상담 스크립트 7개도 각각 5단계 [공감 -> 질문 -> 피드백 -> 동기부여 -> 행동계획]를 대화체 시나리오로 온전히 전부 구현해 주어야 합니다.`;
    }

    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    // Gemini API 호출 (gemini-3.5-flash 모델 적용)
    const response = await requestAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nextStep: {
              type: Type.INTEGER,
              description: "다음 안내할 단계 (1: 기초자료 접수 및 상황 질문, 2: 상황 접수 및 상담 메모 질문, 3: 최종 보고서 출력 완료)",
            },
            message: {
              type: Type.STRING,
              description: "상담사 선생님에게 전하는 부드럽고 전문적인 대화 피드백 메시지",
            },
            reportData: {
              type: Type.OBJECT,
              properties: {
                tab1_profile: {
                  type: Type.STRING,
                  description: "참여자 기초자료 분석 (가), 현재상황 및 상담내용 분석 (나, 다), 직업프로파일 10대 항목 (라) 마크다운",
                },
                tab2_recommendation: {
                  type: Type.STRING,
                  description: "맞춤형 희망직종 추천 (마), 의사결정 비교표 (사) 마크다운 및 비교 분석",
                },
                tab3_tools: {
                  type: Type.STRING,
                  description: "상담 질문지 50개 (바) 및 7개 상황별 대화 스크립트 (자) 전부 작성, 미확정자 탐색전략 (아) 마크다운",
                },
                tab4_report: {
                  type: Type.STRING,
                  description: "최종 종합리포트 출력 (차) 국민취업지원제도 상담기록 양식 마크다운",
                },
              },
              required: ["tab1_profile", "tab2_recommendation", "tab3_tools", "tab4_report"],
            },
          },
          required: ["nextStep", "message"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini로부터 빈 응답을 받았습니다.");
    }

    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message || "서버 분석 에러가 발생했습니다." });
  }
});

// Vite 및 정적 파일 서빙 설정
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

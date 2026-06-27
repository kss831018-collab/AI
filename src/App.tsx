import React, { useState, useEffect, useRef } from "react";
import { Message, FileData, CurrentStatus, CounselorNotes, ReportData, AnalyzeResponse } from "./types";
import { CurrentStatusForm } from "./components/CurrentStatusForm";
import { CounselorNotesForm } from "./components/CounselorNotesForm";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { 
  FileText, 
  Upload, 
  Send, 
  User, 
  Sparkles, 
  FileDown, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase, 
  ClipboardList, 
  ArrowRight,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  TrendingUp,
  Target,
  ShieldCheck,
  BookOpen
} from "lucide-react";

export default function App() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [previewTab, setPreviewTab] = useState<"profile" | "matrix" | "toolkit" | "form">("profile");

  // Gemini API 키 등록 관련 상태
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("gemini_api_key") || "";
  });
  const [isKeyValidated, setIsKeyValidated] = useState<boolean>(() => {
    return localStorage.getItem("gemini_api_key_valid") === "true";
  });
  const [apiValidationLoading, setApiValidationLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>(() => {
    return localStorage.getItem("gemini_api_key") || "";
  });

  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setValidationError("API 키를 입력해 주세요.");
      return;
    }
    
    setApiValidationLoading(true);
    setValidationError("");
    
    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem("gemini_api_key", key.trim());
        localStorage.setItem("gemini_api_key_valid", "true");
        setGeminiApiKey(key.trim());
        setIsKeyValidated(true);
        setValidationError("");
      } else {
        setIsKeyValidated(false);
        localStorage.removeItem("gemini_api_key_valid");
        setValidationError(data.error || "유효하지 않은 API 키입니다. 다시 입력해 주세요.");
      }
    } catch (err: any) {
      setIsKeyValidated(false);
      localStorage.removeItem("gemini_api_key_valid");
      setValidationError("서버가 응답하지 않거나 네트워크 오류가 발생했습니다.");
    } finally {
      setApiValidationLoading(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem("gemini_api_key");
    localStorage.removeItem("gemini_api_key_valid");
    setGeminiApiKey("");
    setKeyInput("");
    setIsKeyValidated(false);
    setValidationError("");
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content: `안녕하세요, 선생님! 국민취업지원제도 참여자의 맞춤형 희망직종 탐색과 의사결정을 지원하는 AI 직업상담 전문가 파트너입니다.

정밀한 프로파일링과 리포트 작성을 위해 데이터를 몇 단계에 걸쳐 순차적으로 확인하고자 합니다.

먼저, 참여자의 **기초자료 파일(입사지원서, 이력서, 자기소개서, 경력기술서, 경험리스트, 직업심리검사 결과지 중 보유하신 서류)**을 아래 파일 첨부 기능으로 업로드해 주시거나 관련 텍스트 내용을 입력해 주세요. (PDF, HWP, DOCX, TXT, 이미지 등 모든 형식을 지원합니다.)`,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [currentStep, setCurrentStep] = useState<number>(1); // 1: 기초자료, 2: 상황정보, 3: 상담메모, 4: 보고서출력완료
  const [inputText, setInputText] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 수집 데이터 저장소
  const [filesContent, setFilesContent] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [counselorNotes, setCounselorNotes] = useState<CounselorNotes | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // 결과 페이지 활성화 탭 (profile, recommendation, tools, report)
  const [activeTab, setActiveTab] = useState<"profile" | "recommendation" | "tools" | "report">("profile");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 샘플 참여자 이력서 파일 불러오기 버튼 (편의 기능)
  const loadSampleResume = () => {
    const sampleText = `[참여자 기초이력서]
■ 인적사항
- 성명: 이정우 (남, 만 28세)
- 학력: 전문대학 멀티미디어과 졸업 (2023년 졸업)
- 거주지: 서울시 마포구 망원동

■ 주요 경력 및 실무경험
- (주)에이치앤디 (6개월 근무 / 계약만료): 총무부서 인턴십. 주로 우편물 관리, 회의실 예약, 소모품 구매 신청, 비품 관리 보조 및 기초 워드프로세서 문서 작성 담당.
- 카페 베네치아 (1년 2개월): 바리스타 및 매장 마감 관리. 고객 응대, 주문 정산, 위생 관리.

■ 보유 자격증 및 기술
- 워드프로세서 1급
- ITQ 한글 A등급, ITQ 파워포인트 B등급
- 2종 보통 운전면허 (실제 운전 가능)
- 엑셀(스프레드시트) 활용: 기초 수준 (수식 계산 및 기본 서식 편집 가능)

■ 직업심리검사 결과 (L형)
- 흥미유형: 사회형(S) 62점, 관습형(C) 58점, 현실형(R) 45점
- 추천 직군: 총무/사무 지원, 고객 서비스 관리, 비서 및 서무 행정`;

    setInputText(sampleText);
    const newFile: FileData = {
      name: "이정우_참여자_기초이력서_및_심리검사결과.txt",
      size: "1.2 KB",
      type: "text/plain",
      content: sampleText,
    };
    setAttachedFiles([newFile]);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newFile: FileData = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || "text/plain",
        content: content || `[업로드된 파일: ${file.name}]`,
      };
      setAttachedFiles((prev) => [...prev, newFile]);
      if (file.type.startsWith("text") || file.name.endsWith(".txt")) {
        setInputText((prev) => (prev ? `${prev}\n\n[첨부파일 내용]\n${content}` : content));
      } else {
        setInputText((prev) => prev ? `${prev}\n\n[첨부파일이 업로드되었습니다: ${file.name}]` : `[첨부파일이 업로드되었습니다: ${file.name}]`);
      }
    };
    reader.readAsText(file);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 1단계 전송 (기초 자료 수집 완료)
  const handleStep1Submit = async () => {
    const textToSend = inputText.trim();
    if (!textToSend && attachedFiles.length === 0) {
      setErrorMsg("참여자의 기초자료 텍스트를 입력하시거나 파일을 업로드해 주세요.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    const userMsgContent = textToSend || `[업로드 파일 ${attachedFiles.length}개 송신]`;
    const newMessages: Message[] = [
      ...messages,
      {
        id: `user-s1-${Date.now()}`,
        role: "user",
        content: userMsgContent,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(newMessages);
    setFilesContent(userMsgContent);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(geminiApiKey ? { "x-gemini-api-key": geminiApiKey } : {})
        },
        body: JSON.stringify({
          step: 1,
          messages: newMessages,
          filesContent: userMsgContent,
        }),
      });

      if (!response.ok) throw new Error("분석 요청 중 오류가 발생했습니다.");
      const data: AnalyzeResponse = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-s1-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setCurrentStep(2);
      setInputText("");
      setAttachedFiles([]);
    } catch (err: any) {
      setErrorMsg(err.message || "서버와 통신하는 도중 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2단계 전송 (현재 상황 정보 완료)
  const handleStep2Submit = async (statusData: CurrentStatus) => {
    setErrorMsg("");
    setIsLoading(true);
    setCurrentStatus(statusData);

    const userMsgContent = `[참여자 현재 상황 정보 입력]
- 희망직종 여부: ${statusData.hasTargetJob === "yes" ? "있음" : "없음"} (${statusData.targetJobDetail})
- 선호/기피 직무: 하고싶은일(${statusData.likes}) / 피하고싶은일(${statusData.dislikes})
- 강약점: 자신있는일(${statusData.strengths}) / 자신없는일(${statusData.weaknesses})
- 희망조건: 임금(${statusData.workConditions.salary}), 지역(${statusData.workConditions.location}), 시간(${statusData.workConditions.hours})
- 기타제한: 건강장애(${statusData.healthRestrictions}), 운전가능여부(${statusData.canDrive === "yes" ? "가능" : "불가능"}), 가족돌봄(${statusData.familySituation})
- 최우선가치: ${statusData.primaryFactor}`;

    const newMessages: Message[] = [
      ...messages,
      {
        id: `user-s2-${Date.now()}`,
        role: "user",
        content: userMsgContent,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(geminiApiKey ? { "x-gemini-api-key": geminiApiKey } : {})
        },
        body: JSON.stringify({
          step: 2,
          messages: newMessages,
          filesContent: filesContent,
          currentStatus: statusData,
        }),
      });

      if (!response.ok) throw new Error("분석 요청 중 오류가 발생했습니다.");
      const data: AnalyzeResponse = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-s2-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || "서버와 통신하는 도중 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3단계 전송 및 최종 결과 일괄 도출
  const handleStep3Submit = async (notesData: CounselorNotes) => {
    setErrorMsg("");
    setIsLoading(true);
    setCounselorNotes(notesData);

    const userMsgContent = `[1회기 상담내용 메모 입력]
- 관찰특징: ${notesData.observation}
- 의사소통방식: ${notesData.communication}
- 현실인식수준: ${notesData.realismLevel}
- 구직 자신감 및 의지: ${notesData.confidence}
- 직업선택 방해요인: ${notesData.barrierFactors}
- 상담사 의견: ${notesData.counselorOpinion}`;

    const newMessages: Message[] = [
      ...messages,
      {
        id: `user-s3-${Date.now()}`,
        role: "user",
        content: userMsgContent,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(geminiApiKey ? { "x-gemini-api-key": geminiApiKey } : {})
        },
        body: JSON.stringify({
          step: 3,
          messages: newMessages,
          filesContent: filesContent,
          currentStatus: currentStatus,
          counselorNotes: notesData,
        }),
      });

      if (!response.ok) throw new Error("최종 종합 리포트 생성 중 시간 초과 또는 오류가 발생했습니다.");
      const data: AnalyzeResponse = await response.json();

      if (data.reportData) {
        setReportData(data.reportData);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-final-${Date.now()}`,
            role: "assistant",
            content: data.message || "모든 종합 데이터 분석과 국민취업지원제도 상담기록 전용 최종 리포트 출력이 완벽히 완료되었습니다! 우측 탭별 패널에서 상세한 정보 및 훈련 연계 가이드를 바로 확인하고 파일로 다운로드해 보세요.",
            timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setCurrentStep(4);
        setActiveTab("profile");
      } else {
        throw new Error("보고서 데이터가 누락되었습니다. 다시 시도해 주세요.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "서버와 통신하는 도중 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 복사 및 다운로드 유틸리티
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadReportFile = () => {
    if (!reportData) return;
    const fullText = `========================================================
국민취업지원제도 참여자 맞춤형 희망직종 탐색 최종 종합리포트
생성일자: ${new Date().toLocaleDateString("ko-KR")}
========================================================

[1. 참여자 프로파일 및 분석 결과]
${reportData.tab1_profile}

[2. 희망직종 추천 및 의사결정 비교표]
${reportData.tab2_recommendation}

[3. 직업상담 전문 도구 및 탐색전략]
${reportData.tab3_tools}

[4. 최종 국민취업지원제도 상담기록 공식양식 (차)]
${reportData.tab4_report}
`;
    const element = document.createElement("a");
    const file = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `국민취업지원제도_맞춤_희망직종_분석리포트_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getPreviewContent = () => {
    switch (previewTab) {
      case "profile":
        return `### 👤 구직자 맞춤형 종합 프로파일 분석
**[대상 참여자 정보]**
- **인적사항:** 이정우 (남, 만 28세) / 전문학사 (멀티미디어과)
- **주요경력:** 총무/사무 보조 인턴 6개월, 바리스타 1년 2개월
- **흥미코드:** 사회형(S) 62점, 관습형(C) 58점, 현실형(R) 45점

**[직업 상담 진단 결과]**
1. **역량 분석:** 멀티미디어 전공 지식과 인턴 업무 경험을 결합하여, **디지털 일반 서무** 및 **사무 지원** 영역에 최적화된 기초 능력을 보유함.
2. **흥미 매칭:** 타인을 지원하고 원활하게 소통하기를 선호하는 사회형(S) 성향과 체계적인 환경을 선호하는 관습형(C) 성향의 결합으로, 단순 반복 사무를 넘어 대고객 소통이 가미된 **'고객지원 총무직'**에서 높은 성취와 지속성이 기대됨.
3. **훈련 추천:** 국민내일배움카드 연계를 통한 **"ERP 회계정보시스템 실무"** 및 **"비즈니스 OA 실무과정"** 이수를 권장함 (2개월 단기 코스).`;
      case "matrix":
        return `### 📊 희망직종 의사결정 10대 지표 비교표
참여자의 심리적 선호와 시장의 현실적 상황을 10대 핵심 지표로 교차 평가하여 의사결정을 돕습니다.

| 비교 지표 | 대안 1: 일반 사무/총무직 | 대안 2: 고객지원/CS직 | 대안 3: 쇼핑몰 웹 디자이너 |
| :--- | :---: | :---: | :---: |
| **1. 본인 선호도** | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| **2. 흥미코드 부합성 (S/C)** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **3. 과거 경력 연계성** | ★★★★☆ | ★★★★★ | ★★☆☆☆ |
| **4. 연봉 및 처우 조건** | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ |
| **5. 출퇴근 거리 및 교통** | ★★★★★ | ★★★★★ | ★★★★☆ |
| **6. 진입 장벽 (자격증)** | ★★☆☆☆ (ITQ보유) | ★★★★★ (즉시가능) | ★☆☆☆☆ (포폴필요) |
| **7. 향후 커리어 확장성** | ★★★★☆ | ★★★☆☆ | ★★★★☆ |
| **8. 가사/돌봄 제약 부합** | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **9. 구인 시장 수요 (티오)** | ★★★★☆ | ★★★★★ | ★★☆☆☆ |
| **10. 장기 근속 가능성** | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |
| **🎯 최종 종합 추천도** | **1순위 (추천)** | **2순위 (대안)** | **3순위 (보류)** |`;
      case "toolkit":
        return `### 💬 맞춤형 밀착 질문지 & 상담 스크립트 툴킷
참여자의 저항을 최소화하고 매끄러운 의사결정을 이끌기 위한 심층 질문 및 설득 스크립트 예시입니다.

#### 🎯 1. 심층 탐색 질문지 (상담 가이드 5선)
1. "이정우 씨, 이전 총무 부서 인턴 생활을 하면서 비품 관리나 문서 작성이 손에 잘 맞으셨나요, 아니면 카페에서 손님들을 대면하는 업무가 더 만족스러우셨나요?"
2. "ITQ 자격증을 우수하게 취득하셨는데, 이를 바탕으로 기업에서 엑셀과 한글을 활용해 실무 행정을 전담하는 일에 도전해 보는 것에 대해 어떻게 생각하시나요?"
3. "이전에 멀티미디어과를 전공하셨는데, 혹시 사무 총무직에 취업하여 기업의 블로그나 SNS 채널 관리 업무까지 병행하며 강점을 드러내는 방향은 어떨까요?"

#### 🗣️ 2. 상담사 추천/설득용 맞춤형 시나리오 멘트
- **[상담사 멘트]:** "이정우 님, 전공과 흥미검사 결과를 분석해 보면 꼼꼼하게 일정을 정돈하고 타인을 지원해 주는 직무에서 가장 시너지가 납니다. 단순 총무 직무는 최근 구인인원이 다소 제한적이지만, 정우 님의 고객 응대 경험을 더해 '고객 지향적 사무 행정원'으로 준비하신다면 직무 만족도와 취업 성공률 모두를 크게 높일 수 있습니다."`;
      case "form":
        return `### 📝 국민취업지원제도 상담기록지 서식 (차 항목 완벽 반영)
현행 법령 및 지침서식의 '구직협의 및 희망직종 의견'란에 즉시 복사하여 사용할 수 있는 전문 양식입니다.

\`\`\`text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[국민취업지원제도 상담기록지 - (차) 희망직종 설정 및 구직성장 가이드]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 참여자 기본정보 및 적합성 진단
 - 성명: 이정우 (만 28세) / 학력: 전문대졸 (멀티미디어 전공)
 - 분석 요약: 사회형(S)-관습형(C) 성향이 뚜렷하여 체계적인 업무 및 인적 교류 결합형 직무에 최적화됨.

2. 희망직종 도출 및 선택 근거
 - 최종 희망직종: 고객지원 총무 행정 사무원 (한국고용직업분류 코드: 026200)
 - 도출 이유: 
   ① 과거 인턴 경력(총무 업무 6개월) 및 ITQ 한글/워드 자격증 보유로 실무 행정 처리 능력 입증.
   ② 사회형 성향이 높아 고객 밀착 응대 및 바리스타 경험을 연계한 정밀 행정 시너지 확보 가능.

3. 구직장애 극복 및 구직활동 촉진 계획
 - 단기 보완사항: ERP 회계프로그램 및 심화 스프레드시트 기능 보완 필요 확인.
 - 구체적 훈련계획: 국민내일배움카드 연계 ERP 실무 과정(2개월) 수강 합의.
 - 취업 지원 서비스: 모의 면접 및 이력서 클리닉 참여 유도.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\``;
      default:
        return "";
    }
  };

  // 초기화 함수
  const handleReset = () => {
    if (confirm("정말로 모든 상담 입력을 초기화하고 새로 시작하시겠습니까?")) {
      setMessages([
        {
          id: "msg-welcome",
          role: "assistant",
          content: `안녕하세요, 선생님! 국민취업지원제도 참여자의 맞춤형 희망직종 탐색과 의사결정을 지원하는 AI 직업상담 전문가 파트너입니다.
  
정밀한 프로파일링과 리포트 작성을 위해 데이터를 몇 단계에 걸쳐 순차적으로 확인하고자 합니다.
  
먼저, 참여자의 **기초자료 파일(입사지원서, 이력서, 자기소개서, 경력기술서, 경험리스트, 직업심리검사 결과지 중 보유하신 서류)**을 아래 파일 첨부 기능으로 업로드해 주시거나 관련 텍스트 내용을 입력해 주세요. (PDF, HWP, DOCX, TXT, 이미지 등 모든 형식을 지원합니다.)`,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setCurrentStep(1);
      setInputText("");
      setAttachedFiles([]);
      setFilesContent("");
      setCurrentStatus(null);
      setCounselorNotes(null);
      setReportData(null);
      setActiveTab("profile");
    }
  };

  if (view === "landing") {
    return (
      <div id="landing-container" className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans overflow-y-auto selection:bg-[#71c9ec]/50 selection:text-slate-900">
        {/* Header - White background with solid bottom border, dark text, clean corporate feel */}
        <header className="border-b-2 border-slate-900 bg-white sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900">
                국민취업지원제도 AI 직업상담 전문가 파트너
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isKeyValidated && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-300 font-bold hidden sm:inline px-2 py-1 rounded-md">
                  API 키 등록됨 🔑
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-bold hidden sm:inline bg-slate-100 px-2 py-1 rounded-md">
                실무 상담사 전용 포털 v3.5-flash
              </span>
              <button
                onClick={() => {
                  if (isKeyValidated) {
                    setView("app");
                  } else {
                    document.getElementById("api-key-section")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className={`text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-2 border-slate-900 ${
                  isKeyValidated ? "bg-slate-900 hover:bg-slate-800" : "bg-[#8b5cf6] hover:bg-[#7c3aed]"
                }`}
              >
                {isKeyValidated ? "솔루션 시작하기" : "API 키 등록하고 시작"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Section 1: Hero (Sky Blue - #71c9ec) */}
        <section className="bg-[#71c9ec] border-b-4 border-slate-900 py-16 px-6 sm:px-8 relative overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left text column */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-slate-900 rounded-full text-[10px] font-black text-slate-900 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <Sparkles className="w-3.5 h-3.5 text-[#e11d48]" />
                국민취업지원제도 Ⅰ·Ⅱ 유형 상담 실무 완벽 매핑
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                단 <span className="underline decoration-slate-900 decoration-4 underline-offset-4">3단계 입력</span>으로 완성하는<br />
                참여자 맞춤형 희망직종 탐색과 행정 자동화
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 max-w-2xl leading-relaxed font-semibold">
                구직자의 기초 서류 마이닝부터 여건 파악, 상담사 의견 융합까지 순차적으로 진행해 보세요.
                실무에 즉시 사용하는 다차원 분석 리포트, 의사결정 매트릭스, 상담 스크립트, 그리고 복제 가능한 공식 상담기록지 서식을 1초 만에 일괄 생성합니다.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <button
                  onClick={() => {
                    if (isKeyValidated) {
                      setView("app");
                    } else {
                      document.getElementById("api-key-section")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-xl transition-all border-2 border-slate-900 flex items-center justify-center gap-2 cursor-pointer group shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none ${
                    isKeyValidated ? "bg-slate-900 hover:bg-slate-800" : "bg-[#8b5cf6] hover:bg-[#7c3aed]"
                  }`}
                >
                  {isKeyValidated ? "상담 프로세스 즉시 개시" : "API 키 등록하고 시작"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#features-section"
                  className="bg-white hover:bg-slate-50 text-slate-950 font-extrabold text-xs sm:text-sm px-6 py-4 rounded-xl border-2 border-slate-900 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-none flex items-center justify-center gap-2"
                >
                  5대 주요 강점 알아보기
                </a>
              </div>
            </div>

            {/* Right illustration column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
                <div className="absolute top-2 left-3 text-[10px] text-slate-400 font-mono font-bold">JOB COUNSELING PARTNER</div>
                {/* Custom modern counseling partner illustration */}
                <div className="py-4 bg-[#71c9ec]/10 rounded-2xl border-2 border-slate-900/10 flex items-center justify-center">
                  <svg viewBox="0 0 400 240" className="w-full max-w-[340px] mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Grid Background Pattern */}
                    <defs>
                      <pattern id="illust-grid-2" width="16" height="16" patternUnits="userSpaceOnUse">
                        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.1" />
                      </pattern>
                      <linearGradient id="bulb-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="100%" stopColor="#eab308" />
                      </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#illust-grid-2)" rx="16" />

                    {/* Background Decorative Badges (Neubrutalism circles & badges) */}
                    <circle cx="200" cy="85" r="45" fill="#fef08a" fillOpacity="0.2" />
                    <circle cx="80" cy="70" r="30" fill="#f43f5e" fillOpacity="0.1" />
                    <circle cx="320" cy="70" r="30" fill="#3b82f6" fillOpacity="0.1" />

                    {/* Floating Value Badges */}
                    {/* Value Badge 1: '가치' */}
                    <g transform="translate(60, 30)">
                      <rect x="0" y="0" width="46" height="20" rx="6" fill="#f43f5e" stroke="#1e293b" strokeWidth="2" />
                      <text x="23" y="13" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">가치 창출</text>
                    </g>
                    {/* Value Badge 2: '맞춤' */}
                    <g transform="translate(290, 30)">
                      <rect x="0" y="0" width="46" height="20" rx="6" fill="#3b82f6" stroke="#1e293b" strokeWidth="2" />
                      <text x="23" y="13" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1:1 맞춤</text>
                    </g>

                    {/* Table Surface at the bottom */}
                    <line x1="20" y1="200" x2="380" y2="200" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 60 200 L 40 235" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 340 200 L 360 235" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

                    {/* LEFT SIDE: 구직자 (이정우 님 - 밝은 표정과 도전정신) */}
                    <g transform="translate(30, 90)">
                      {/* Body */}
                      <path d="M 15 110 C 15 75 65 75 65 110" fill="#f43f5e" stroke="#1e293b" strokeWidth="3" />
                      {/* Collar */}
                      <path d="M 32 82 L 40 92 L 48 82" fill="none" stroke="#1e293b" strokeWidth="2" />
                      {/* Face/Head */}
                      <circle cx="40" cy="55" r="18" fill="#fff" stroke="#1e293b" strokeWidth="3" />
                      {/* Hair (Cheerful messy cut) */}
                      <path d="M 22 52 C 22 36, 58 36, 58 52 C 54 44, 46 42, 40 45 C 34 42, 26 44, 22 52 Z" fill="#1e293b" stroke="#1e293b" strokeWidth="1" />
                      {/* Eyes / Smile */}
                      <path d="M 32 55 Q 35 52 38 55" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M 42 55 Q 45 52 48 55" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M 35 64 Q 40 69 45 64" stroke="#1e293b" strokeWidth="2" fill="#fff" strokeLinecap="round" />
                      {/* Left Arm gesturing towards center bulb */}
                      <path d="M 58 90 Q 75 80 82 85" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <circle cx="83" cy="85" r="4.5" fill="#fff" stroke="#1e293b" strokeWidth="2" />
                    </g>

                    {/* RIGHT SIDE: 전문 직업상담사 (신뢰감과 따뜻한 코칭) */}
                    <g transform="translate(290, 90)">
                      {/* Body */}
                      <path d="M 15 110 C 15 75 65 75 65 110" fill="#22c55e" stroke="#1e293b" strokeWidth="3" />
                      {/* ID Badge */}
                      <rect x="35" y="86" width="10" height="14" rx="2" fill="#3b82f6" stroke="#1e293b" strokeWidth="1.5" />
                      <line x1="40" y1="80" x2="40" y2="86" stroke="#1e293b" strokeWidth="1.5" />
                      {/* Face/Head */}
                      <circle cx="40" cy="55" r="18" fill="#fff" stroke="#1e293b" strokeWidth="3" />
                      {/* Hair (Neat corporate cut) */}
                      <path d="M 22 50 C 22 34, 58 34, 58 50 C 58 40, 52 38, 40 38 C 28 38, 22 40, 22 50 Z" fill="#1e293b" stroke="#1e293b" strokeWidth="1" />
                      {/* Glasses */}
                      <circle cx="33" cy="54" r="5" fill="none" stroke="#1e293b" strokeWidth="2" />
                      <circle cx="47" cy="54" r="5" fill="none" stroke="#1e293b" strokeWidth="2" />
                      <line x1="38" y1="54" x2="42" y2="54" stroke="#1e293b" strokeWidth="2" />
                      {/* Smile */}
                      <path d="M 37 65 Q 40 68 43 65" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
                      {/* Right Hand holding clip board */}
                      <path d="M 22 92 Q 8 85 -2 90" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <g transform="translate(-14, 85) rotate(-10)">
                        <rect x="0" y="0" width="18" height="24" rx="2" fill="#fff" stroke="#1e293b" strokeWidth="2" />
                        <rect x="5" y="-3" width="8" height="4" fill="#ca8a04" stroke="#1e293b" strokeWidth="1.5" />
                        <line x1="4" y1="6" x2="14" y2="6" stroke="#1e293b" strokeWidth="1.5" />
                        <line x1="4" y1="12" x2="14" y2="12" stroke="#1e293b" strokeWidth="1.5" />
                        <line x1="4" y1="18" x2="11" y2="18" stroke="#1e293b" strokeWidth="1.5" />
                      </g>
                    </g>

                    {/* CENTER: 가치를 밝히는 일자리 전구와 시너지 요소 */}
                    <g transform="translate(170, 70)">
                      {/* Glowing Light Lines */}
                      <line x1="30" y1="-10" x2="30" y2="-22" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
                      <line x1="5" y1="10" x2="-5" y2="5" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
                      <line x1="55" y1="10" x2="65" y2="5" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
                      <line x1="12" y1="38" x2="2" y2="44" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
                      <line x1="48" y1="38" x2="58" y2="44" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />

                      {/* Light Bulb */}
                      <path d="M 18 20 C 18 5, 42 5, 42 20 C 42 28, 36 32, 36 38 L 24 38 C 24 32, 18 28, 18 20 Z" fill="url(#bulb-glow)" stroke="#1e293b" strokeWidth="3.5" />
                      {/* Bulb Base */}
                      <rect x="25" y="38" width="10" height="4" rx="1" fill="#94a3b8" stroke="#1e293b" strokeWidth="2" />
                      <rect x="26" y="42" width="8" height="4" rx="1" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
                      <path d="M 28 46 L 32 46" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                      {/* Inside Heart Filament (Symbolizing care & warm match) */}
                      <path d="M 30 18 Q 30 14, 27 15 Q 24 16, 27 21 L 30 24 L 33 21 Q 36 16, 33 15 Q 30 14, 30 18" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

                      {/* Overlapping Key & Target Concept */}
                      <g transform="translate(10, 60)">
                        {/* Connecting dotted trajectory to seekers */}
                        <path d="M -50 45 Q -20 15, 10 15" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                        <path d="M 110 45 Q 80 15, 50 15" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                        
                        {/* Target Board */}
                        <circle cx="30" cy="15" r="16" fill="#a855f7" stroke="#1e293b" strokeWidth="2" />
                        <circle cx="30" cy="15" r="10" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                        <circle cx="30" cy="15" r="4" fill="#a855f7" />
                      </g>
                    </g>

                    {/* Sparkling stars for 'Value Creation' */}
                    <path d="M 130 50 L 133 55 L 138 56 L 134 60 L 135 65 L 130 62 L 125 65 L 126 60 L 122 56 L 127 55 Z" fill="#ca8a04" stroke="#1e293b" strokeWidth="1" />
                    <path d="M 270 65 L 272 68 L 276 69 L 273 72 L 274 76 L 270 74 L 266 76 L 267 72 L 264 69 L 268 68 Z" fill="#ca8a04" stroke="#1e293b" strokeWidth="1" />
                  </svg>
                </div>
                <div className="mt-4 text-center">
                  <span className="font-extrabold text-xs text-slate-900 bg-[#71c9ec] px-3 py-1 rounded-full border-2 border-slate-900">
                    가치를 만드는 맞춤 일자리 상담 파트너
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gemini API Key Section */}
        <section id="api-key-section" className="bg-[#f5f3ff] border-b-4 border-slate-900 py-16 px-6 sm:px-8 relative">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl border-4 border-slate-900 p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
              {/* Header inside card */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#8b5cf6] rounded-full flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Gemini API 키 등록
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1">
                    본 진단은 사용자 본인의 Google Gemini API 키로 동작합니다. 키는 이 브라우저에만 저장되며 외부로 전송되지 않습니다.
                  </p>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-[#8b5cf6]" />
                      API KEY
                    </label>
                    <a
                      href="https://aistudio.google.com/app/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black text-[#8b5cf6] hover:underline flex items-center gap-1"
                    >
                      Google AI Studio에서 키 발급받기 ↗
                    </a>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="AIzaSy...로 시작하는 키를 붙여넣으세요"
                      disabled={isKeyValidated || apiValidationLoading}
                      className="flex-1 bg-white border-2 border-slate-900 rounded-xl px-4 py-3.5 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] placeholder:text-slate-400 font-bold disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    
                    {!isKeyValidated ? (
                      <button
                        onClick={() => validateApiKey(keyInput)}
                        disabled={apiValidationLoading}
                        className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                      >
                        {apiValidationLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            검증 중...
                          </>
                        ) : (
                          "키 검증 후 등록"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleClearKey}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0"
                      >
                        키 변경 및 해제
                      </button>
                    )}
                  </div>
                </div>

                {/* Validation Status message */}
                {validationError && (
                  <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border-2 border-rose-900 rounded-xl p-3.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(225,29,72,0.1)] animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {isKeyValidated && (
                  <div className="flex items-center gap-2 text-[#16a34a] bg-[#f0fdf4] border-2 border-[#16a34a] rounded-xl p-3.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(22,163,74,0.1)]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>API 키가 유효하며 정상 등록되었습니다. 이제 서비스를 사용하실 수 있습니다!</span>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 font-bold leading-relaxed pt-2">
                  ※ 입력된 API 키는 오직 브라우저의 내부 저장소(<span className="font-mono bg-slate-100 px-1 py-0.5 rounded">localStorage</span>)에만 안전하게 기록되며, 분석 요청 시에만 서버 API 프록시를 거쳐 구글 Gemini 공식 서비스로 전송됩니다. 어떤 정보도 비인가 제3자에게 저장되거나 공유되지 않습니다.
                </p>
              </div>

              {/* Big Bottom Action Button inside the card as required */}
              <div className="border-t-2 border-slate-200 mt-6 pt-6 flex justify-center">
                {isKeyValidated ? (
                  <button
                    onClick={() => setView("app")}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black text-sm px-10 py-4.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(139,92,246,1)] hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    상담 프로그램 시작하기
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#8b5cf6]" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full sm:w-auto bg-slate-100 text-slate-400 font-extrabold text-sm px-10 py-4.5 rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    키 등록 후 시작할 수 있어요
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: BRANDING (Yellow - #edd068) */}
        <section className="bg-[#f0da74] border-b-4 border-slate-900 py-16 px-6 sm:px-8 relative">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left info column */}
            <div className="lg:col-span-4 space-y-4">
              <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 block font-mono">
                정밀분석
              </span>
              <div className="h-1.5 w-16 bg-slate-900 rounded"></div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                ① 다각적 프로파일링 & ② 10대 지표 의사결정표
              </h2>
              <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                참여자의 고유한 성향, 과거 경험, 직업심리 지표를 융합하여 진로를 정교히 마이닝합니다.
              </p>
              
              {/* Process Bubbles matching the reference yellow section circles */}
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center font-extrabold text-xs text-slate-900 shrink-0 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    1
                  </div>
                  <span className="text-xs font-bold text-slate-900">이력서/심리코드 마이닝</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center font-extrabold text-xs text-slate-900 shrink-0 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-900">제약 여건 실시간 분석</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center font-extrabold text-xs text-slate-900 shrink-0 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-900">표준 보고서 서식 출력</span>
                </div>
              </div>

              {/* Yellow Section Line-Art Illustration */}
              <div className="pt-6 hidden lg:block">
                <svg viewBox="0 0 200 120" className="w-full max-w-[220px] opacity-80">
                  <rect x="70" y="20" width="60" height="80" rx="6" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
                  <rect x="85" y="15" width="30" height="10" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="2" />
                  <line x1="80" y1="45" x2="120" y2="45" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="80" y1="60" x2="120" y2="60" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="80" y1="75" x2="110" y2="75" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 30 90 Q 50 40 65 60 M 170 90 Q 150 40 135 60" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Right Interactive Preview Box */}
            <div className="lg:col-span-8 w-full">
              <div className="bg-white rounded-2xl border-4 border-slate-900 p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative">
                <div className="absolute top-4 right-4 text-[10px] text-slate-400 font-mono font-bold">
                  LIVE INTERACTIVE DEMO OUTLINE
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-slate-900" />
                    생성 결과물 대화형 미리보기
                  </h3>
                  <p className="text-[10px] text-slate-600 font-bold">
                    실제 상담을 마쳤을 때 출력되는 주요 항목을 클릭하여 미리 체험해 보세요.
                  </p>
                </div>

                {/* Simulated Tabs - styling with custom dark-bordered boxes */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b-2 border-slate-900/10">
                  <button
                    onClick={() => setPreviewTab("profile")}
                    className={`px-3 py-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                      previewTab === "profile" ? "bg-slate-900 text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    ① 다각적 프로파일링
                  </button>
                  <button
                    onClick={() => setPreviewTab("matrix")}
                    className={`px-3 py-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                      previewTab === "matrix" ? "bg-slate-900 text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    ② 10대 지표 의사결정표
                  </button>
                  <button
                    onClick={() => setPreviewTab("toolkit")}
                    className={`px-3 py-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                      previewTab === "toolkit" ? "bg-slate-900 text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    ③ 질문지 & 상담사 스크립트
                  </button>
                  <button
                    onClick={() => setPreviewTab("form")}
                    className={`px-3 py-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                      previewTab === "form" ? "bg-slate-900 text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    ④ 공인 제출서식(차) 자동화
                  </button>
                </div>

                {/* Preview Output Frame */}
                <div className="bg-slate-50 rounded-xl border-2 border-slate-900 p-5 min-h-[220px] shadow-inner text-slate-800 text-xs font-medium">
                  <MarkdownRenderer content={getPreviewContent()} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: MARKETING / 5 Core Strengths (Peach/Terracotta - #e39e6e) */}
        <section id="features-section" className="bg-[#e39e6e] border-b-4 border-slate-900 py-16 px-6 sm:px-8 scroll-mt-16 relative">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Heading row with logo illustration */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3 text-left">
                <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 block font-mono">
                  핵심기능
                </span>
                <div className="h-1.5 w-16 bg-slate-900 rounded"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  기존 직무 추천 시스템의 차원을 뛰어넘는 <span className="underline decoration-slate-900 decoration-3">5가지 특장점</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-900 max-w-2xl font-semibold leading-relaxed">
                  행정 피로도는 극소화하고, 구직자의 심리적 반발 극복과 안정적 전직 조율 기능에 완전히 특화되어 있습니다.
                </p>
              </div>

              {/* Running man illustration */}
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <svg viewBox="0 0 200 110" className="w-full max-w-[180px] opacity-90">
                  <circle cx="120" cy="30" r="9" fill="none" stroke="#1e293b" strokeWidth="3" />
                  <path d="M 120 39 L 100 70 L 80 65 M 100 70 L 110 100 L 130 95 M 100 70 L 80 85 L 90 105" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                  <rect x="125" y="55" width="22" height="18" rx="2" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
                  <path d="M 131 55 L 131 50 L 140 50 L 140 55" fill="none" stroke="#1e293b" strokeWidth="2" />
                  <path d="M 50 30 Q 70 20 55 10 M 30 50 Q 50 40 35 30 M 45 70 Q 65 60 50 50" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Grid - styled like custom colored buttons and cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Feature 1 */}
              <div className="md:col-span-8 bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                    01
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 mb-1 flex items-center gap-1.5">
                      단계별 대화/설문 복합 마이닝
                      <span className="text-[9px] bg-slate-100 text-slate-800 border border-slate-900 px-1.5 py-0.5 rounded font-extrabold">STEP-BY-STEP</span>
                    </h3>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                      단 한 번에 복잡한 정보를 쏟아내는 정보 피로도를 전면 배제했습니다. 이력서 및 직업심리검사 기초접수 ➔ 구직 제약 요건 파악 ➔ 심층 관찰 정보 기록까지 논리적으로 연결된 3단 빌드업 과정을 거치므로, 누락 없이 세밀한 데이터 확보가 가능합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="md:col-span-4 bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                    02
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 mb-1">입체적 참여자 정밀 분석</h3>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                      학력, 과거 짧은 인턴/알바 경험, 자격증은 물론 직업심리검사 L형 및 S형 점수(S형 사회성, C형 규칙준수성 등)를 완벽히 매핑하여 참여자가 지닌 숨겨진 잠재 역량을 정밀하게 마이닝합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="md:col-span-4 bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                    03
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 mb-1">대안 매칭 및 의사결정 Matrix</h3>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                      참여자의 전공 경력과 정확히 일치하는 **'직진형 목표'**와 고용 안정성, 근무지/시간 등 구직 현실을 적극 반영한 **'우회형 대안'**을 동시에 제시합니다. 10대 정량 지표 수치 평점을 활용해 대안을 명쾌히 비교 대조합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="md:col-span-8 bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                    04
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 mb-1 flex items-center gap-1.5">
                      실무 상담사 지원용 밀착형 Toolkit
                      <span className="text-[9px] bg-slate-100 text-slate-800 border border-slate-900 px-1.5 py-0.5 rounded font-extrabold">Bespoke Toolkit</span>
                    </h3>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                      상담사 선생님의 실제 상담 피로를 획기적으로 줄여 드립니다. 심층적인 구조화 인터뷰 질문 50선과 더불어 취업 장애요소(과도한 조건 희망, 이직 회피, 의지 부족) 등 현장에서 빈발하는 유형에 즉각 대처할 수 있는 실무상담 대안 시나리오 7종을 완벽히 탑재하였습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="md:col-span-12 bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">
                      05
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      국민취업지원제도 표준 제출 양식 자동 매핑
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                    최종적으로 도출된 상담 요약은 국민취업지원제도 공식 전산 시스템의 취업상담 지원기록(차 항목) 양식 형식에 맞추어 완벽하게 표준화된 텍스트로 인쇄됩니다. 번거롭게 다시 요약하고 타이핑할 필요 없이 단 한 번의 클릭 복사로 행정 업무 처리가 완벽히 종결됩니다.
                  </p>
                </div>
                <div className="shrink-0 p-4 bg-[#e39e6e]/20 border-2 border-slate-900 rounded-xl text-[11px] font-extrabold text-slate-900 text-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  📄 클릭 한 번으로 <br />
                  전산 이관 행정 피로도 0%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: DESIGN / FAQs & Statistics (Green - #88ca8c) */}
        <section className="bg-[#8cc98e] border-b-4 border-slate-900 py-16 px-6 sm:px-8 relative">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Header / Brand Title Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3 text-left">
                <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 block font-mono">
                  실무지원
                </span>
                <div className="h-1.5 w-16 bg-slate-900 rounded"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  직업상담사 선생님들이 가장 궁금해하는 내용
                </h2>
                <p className="text-xs sm:text-sm text-slate-950 font-bold">
                  현장 업무 환경에 밀착한 실무 핵심 질의응답
                </p>
              </div>

              {/* Chat trend illustration */}
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <svg viewBox="0 0 200 110" className="w-full max-w-[180px] opacity-90">
                  <path d="M 20 90 L 60 65 L 100 75 L 140 35 L 170 15" fill="none" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="60" cy="65" r="4.5" fill="#22c55e" stroke="#1e293b" strokeWidth="2" />
                  <circle cx="100" cy="75" r="4.5" fill="#22c55e" stroke="#1e293b" strokeWidth="2" />
                  <circle cx="140" cy="35" r="4.5" fill="#22c55e" stroke="#1e293b" strokeWidth="2" />
                  <path d="M 40 85 C 40 65 65 65 70 45 M 140 85 C 140 65 115 65 110 45" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Statistics Row - styled like custom solid cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border-4 border-slate-900 p-5 text-center space-y-1 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">상담 준비 효율</span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  평균 40분 ➔ <span className="bg-[#71c9ec] px-1.5 py-0.5 rounded border border-slate-900">3분</span>
                </h3>
                <p className="text-[10px] text-slate-600 font-bold">참여자 정보 파악부터 매핑 및 리포트 작성 대폭 압축</p>
              </div>

              <div className="bg-white rounded-2xl border-4 border-slate-900 p-5 text-center space-y-1 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">전산 행정 속도</span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  약 <span className="bg-[#f0da74] px-1.5 py-0.5 rounded border border-slate-900">15배</span> 향상
                </h3>
                <p className="text-[10px] text-slate-600 font-bold">차 항목 전용 공식 기록지 즉각 복사/파일 이송 지원</p>
              </div>

              <div className="bg-white rounded-2xl border-4 border-slate-900 p-5 text-center space-y-1 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">직종 조율 성공률</span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  <span className="bg-[#e39e6e] text-white px-1.5 py-0.5 rounded border border-slate-900">89%</span> 이상
                </h3>
                <p className="text-[10px] text-slate-600 font-bold">훈련 연계 기반 대안 제안으로 원활한 심리 타협 유도</p>
              </div>
            </div>

            {/* Accordion FAQs */}
            <div className="space-y-3 max-w-4xl mx-auto pt-4">
              <div className="bg-white border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <button
                  onClick={() => setFaqOpen(faqOpen === 0 ? null : 0)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black text-slate-900 hover:bg-slate-50 cursor-pointer"
                >
                  <span>Q1. 입력한 구직자의 개인정보나 상담 기록은 안전하게 보존/보호되나요?</span>
                  <ChevronDown className={`w-4 h-4 text-slate-900 shrink-0 transition-transform duration-200 ${faqOpen === 0 ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === 0 && (
                  <div className="px-5 pb-4 pt-1 text-[11px] text-slate-700 leading-relaxed border-t-2 border-slate-900 bg-slate-50 font-bold">
                    본 솔루션은 입력된 데이터를 로컬 브라우저 세션과 연동하여 보안성을 유지합니다. 인공지능 분석은 서버와 보안 프록시 터널을 통해 실시간으로 처리되며, 어떠한 외부 영구 저장소나 데이터베이스에도 참여자의 실명, 연락처 등 식별성 정보를 보관하거나 학습용으로 수집하지 않습니다. 행정 규칙 가이드라인을 완벽히 만족하므로 안심하고 사용하셔도 좋습니다.
                  </div>
                )}
              </div>

              <div className="bg-white border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <button
                  onClick={() => setFaqOpen(faqOpen === 1 ? null : 1)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black text-slate-900 hover:bg-slate-50 cursor-pointer"
                >
                  <span>Q2. 일반적인 추천 외에 정부 정책(내일배움카드, 일경험 프로그램) 연계 가이드도 제안되나요?</span>
                  <ChevronDown className={`w-4 h-4 text-slate-900 shrink-0 transition-transform duration-200 ${faqOpen === 1 ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === 1 && (
                  <div className="px-5 pb-4 pt-1 text-[11px] text-slate-700 leading-relaxed border-t-2 border-slate-900 bg-slate-50 font-bold">
                    네, 그렇습니다. 본 엔진은 단순히 적절한 추천 직종 코드만을 뱉어내지 않고, 구직자가 해당 직무에 안착하기 위해 국민내일배움카드로 이수할 수 있는 '구체적인 기초/중급 훈련 프로그램 명칭'과 실무 공백 및 공포를 제거해 줄 수 있는 '국민취업지원제도 체험형/인턴형 일경험 프로그램 직무 설계안'을 맞춤형 툴킷과 통합 리포트에 실시간으로 연계하여 완벽히 제안해 줍니다.
                  </div>
                )}
              </div>

              <div className="bg-white border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <button
                  onClick={() => setFaqOpen(faqOpen === 2 ? null : 2)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black text-slate-900 hover:bg-slate-50 cursor-pointer"
                >
                  <span>Q3. 직업심리검사 L형 점수 및 흥미코드 분석 점수를 어떻게 넣는 게 좋은가요?</span>
                  <ChevronDown className={`w-4 h-4 text-slate-900 shrink-0 transition-transform duration-200 ${faqOpen === 2 ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === 2 && (
                  <div className="px-5 pb-4 pt-1 text-[11px] text-slate-700 leading-relaxed border-t-2 border-slate-900 bg-slate-50 font-bold">
                    1단계 기초자료 텍스트 기재란 또는 2단계 참여자 상황 정보의 메모란 등에 흥미코드와 대표점수(예: '직업심리검사 결과 사회형(S) 62점, 관습형(C) 58점, 현실형(R) 45점')를 편하게 적어 주세요. 지능 마이닝 필터가 해당 점수를 분석하여 해당 코드가 의미하는 적성(S형: 대면보조 및 인적 교류 선호, C형: 규칙성과 꼼꼼함 중심 서무 정렬 등)에 완벽히 매칭하는 대안을 선출합니다.
                  </div>
                )}
              </div>

              <div className="bg-white border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <button
                  onClick={() => setFaqOpen(faqOpen === 3 ? null : 3)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-black text-slate-900 hover:bg-slate-50 cursor-pointer"
                >
                  <span>Q4. 특별히 경력이 없는 20대 청년층이나 장기 경력 단절 중장년층 구직자도 맞춤화가 되나요?</span>
                  <ChevronDown className={`w-4 h-4 text-slate-900 shrink-0 transition-transform duration-200 ${faqOpen === 3 ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === 3 && (
                  <div className="px-5 pb-4 pt-1 text-[11px] text-slate-700 leading-relaxed border-t-2 border-slate-900 bg-slate-50 font-bold">
                    물론입니다. 공식 이력이 없는 청년의 경우 학과 경험, 성향적 강점, 대중교통 거동 조건, 취업 우선 요소(자아실현 대 급여수준)를 바탕으로 '직진 경로'를 구축하고, 무경력 회방 극복을 위한 스크립트 멘트가 지원됩니다. 중장년층의 경우 이전 퇴직 경력과 현재 가능한 실무 제약(거부직무 및 주부 가사 돌봄 시간 등)을 정확히 계산하여 현실적 대안 경로를 빌드해 줍니다.
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Big CTA Section */}
        <section className="py-20 px-6 sm:px-8 text-center bg-slate-100 border-b-4 border-slate-900 relative">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              실무 행정의 피로를 끝내고,<br />
              참여자 맞춤형 심층 지도에 집중하십시오
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-bold max-w-xl mx-auto">
              국민취업지원제도 지능적 융합 직업상담 솔루션 파트너가 상담사 선생님의 실무 든든한 동반자가 되어 드립니다.
            </p>
            <div>
              <button
                onClick={() => setView("app")}
                className="inline-flex items-center gap-2 px-8 py-4.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-[4px_4px_0px_0px_rgba(113,201,236,1)] hover:shadow-none border-2 border-slate-900 cursor-pointer"
              >
                AI 직업상담 파트너 시작하기 (3단계 분석)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Footer - Slate Dark color matching footer from reference image */}
        <footer className="bg-[#33312e] border-t-2 border-slate-900 py-12 text-center text-[11px] text-stone-400 font-bold">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-3">
            <div className="flex justify-center items-center gap-3 mb-2 opacity-85">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <Briefcase className="w-4.5 h-4.5 text-stone-900" />
              </div>
              <span className="text-xs font-black tracking-tight text-white">
                국민취업지원제도 AI 직업상담 전문가 파트너
              </span>
            </div>
            <p>© 2026 국민취업지원제도 AI 직업상담 전문가 파트너. All Rights Reserved.</p>
            <p className="max-w-2xl mx-auto opacity-75">
              본 솔루션은 현장 전산 행정 절차 단축과 상담 질 향상을 목적으로 개발된 전문 지원 시스템입니다.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div id="app-container" className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header with high contrast line */}
      <header id="app-header" className="h-16 border-b border-slate-800/80 flex items-center justify-between px-8 bg-slate-900/60 backdrop-blur-xl z-20 shadow-lg">
        <div className="flex items-center gap-4.5">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 ring-1 ring-teal-400/30">
            <Briefcase className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold tracking-tight text-white flex items-center gap-2">
              국민취업지원제도 AI 직업상담 전문가 파트너
            </h1>
            <p className="text-[10.5px] text-slate-400 font-medium">참여자 맞춤형 희망직종 입체 분석 및 상담기록 연계 솔루션</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]"></span>
            베테랑 직업상담 모드
          </span>
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer font-semibold shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            상담 초기화
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Progress tracker */}
        <aside id="progress-sidebar" className="w-72 border-r border-slate-800 bg-slate-900/30 p-8 flex flex-col justify-between shrink-0">
          <div className="space-y-8">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-extrabold">진행 프로세스</h2>
            <nav className="space-y-6">
              {/* Step 1 */}
              <div className={`flex items-start gap-4.5 transition-all duration-300 ${currentStep < 1 ? "opacity-30" : "opacity-100"}`}>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  currentStep > 1 
                    ? "bg-teal-500/15 border-teal-500 text-teal-400" 
                    : currentStep === 1 
                      ? "bg-teal-600 border-teal-500 text-white shadow-xl shadow-teal-500/20" 
                      : "border-slate-800 text-slate-500"
                }`}>
                  {currentStep > 1 ? "✓" : "01"}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[13px] font-bold ${currentStep === 1 ? "text-teal-400" : "text-slate-200"}`}>참여자 기초자료 수집</span>
                  <span className="text-[10.5px] text-slate-400 mt-1">이력서 및 자기소개서</span>
                  {currentStep === 1 && <span className="text-[9.5px] text-teal-400 font-bold mt-1.5 animate-pulse">진행 중</span>}
                </div>
              </div>

              {/* Step 2 */}
              <div className={`flex items-start gap-4.5 transition-all duration-300 ${currentStep < 2 ? "opacity-30" : "opacity-100"}`}>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  currentStep > 2 
                    ? "bg-teal-500/15 border-teal-500 text-teal-400" 
                    : currentStep === 2 
                      ? "bg-teal-600 border-teal-500 text-white shadow-xl shadow-teal-500/20" 
                      : "border-slate-800 text-slate-500"
                }`}>
                  {currentStep > 2 ? "✓" : "02"}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[13px] font-bold ${currentStep === 2 ? "text-teal-400" : "text-slate-200"}`}>구직자 현재 상황 분석</span>
                  <span className="text-[10.5px] text-slate-400 mt-1">희망조건 및 직무선호도</span>
                  {currentStep === 2 && <span className="text-[9.5px] text-teal-400 font-bold mt-1.5 animate-pulse">진행 중</span>}
                </div>
              </div>

              {/* Step 3 */}
              <div className={`flex items-start gap-4.5 transition-all duration-300 ${currentStep < 3 ? "opacity-30" : "opacity-100"}`}>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  currentStep > 3 
                    ? "bg-teal-500/15 border-teal-500 text-teal-400" 
                    : currentStep === 3 
                      ? "bg-teal-600 border-teal-500 text-white shadow-xl shadow-teal-500/20" 
                      : "border-slate-800 text-slate-500"
                }`}>
                  {currentStep > 3 ? "✓" : "03"}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[13px] font-bold ${currentStep === 3 ? "text-teal-400" : "text-slate-200"}`}>상담자 1회기 상담 메모</span>
                  <span className="text-[10.5px] text-slate-400 mt-1">관찰 특성 및 취업 장애요소</span>
                  {currentStep === 3 && <span className="text-[9.5px] text-teal-400 font-bold mt-1.5 animate-pulse">진행 중</span>}
                </div>
              </div>

              {/* Step 4: Final Output */}
              <div className={`flex items-start gap-4.5 transition-all duration-300 ${currentStep < 4 ? "opacity-30" : "opacity-100"}`}>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  currentStep === 4 
                    ? "bg-teal-500 border-teal-500 text-white shadow-xl shadow-teal-500/20 animate-bounce" 
                    : "border-slate-800 text-slate-500"
                }`}>
                  ★
                </div>
                <div className="flex flex-col">
                  <span className={`text-[13px] font-bold ${currentStep === 4 ? "text-teal-400" : "text-slate-200"}`}>종합 리포트 일괄 출력</span>
                  <span className="text-[10.5px] text-slate-400 mt-1">매핑 및 비교 매트릭스 완성</span>
                  {currentStep === 4 && <span className="text-[9.5px] text-teal-400 font-bold mt-1.5">출력 완료</span>}
                </div>
              </div>
            </nav>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5 shadow-md">
            <h4 className="text-[10.5px] font-bold text-teal-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              전문 직업 상담 가이드
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              참여자의 단순한 공백 나열을 넘어서, <strong>국민내일배움카드 훈련</strong> 및 <strong>일경험 프로그램</strong> 등 적극적인 정부 정책 연계안을 일괄 제안합니다.
            </p>
          </div>
        </aside>

        {/* Center Section: Main interaction/chat and tab outputs */}
        <section id="main-interaction" className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          
          {/* Top Banner indicating completion */}
          {currentStep === 4 && (
            <div className="bg-teal-950/20 border-b border-teal-900/50 px-8 py-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                <span className="text-[12px] text-slate-200 font-bold">
                  상담 결과 매핑 완료! 우측 다운로드 및 클립보드 복사 툴로 즉시 이관이 가능합니다.
                </span>
              </div>
              <button
                onClick={downloadReportFile}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all cursor-pointer shadow-md shadow-teal-600/10 hover:shadow-teal-500/20"
              >
                <FileDown className="w-4 h-4" />
                종합 보고서 다운로드 (.txt)
              </button>
            </div>
          )}

          {/* Core Content Box */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentStep < 4 ? (
              // Multi-turn onboarding chats
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4.5 max-w-4xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                      msg.role === "user" ? "bg-slate-800 border border-slate-700/80" : "bg-teal-600 text-white shadow-lg shadow-teal-500/15"
                    }`}>
                      {msg.role === "user" ? <User className="w-4.5 h-4.5 text-slate-300" /> : <Sparkles className="w-4.5 h-4.5" />}
                    </div>
                    <div className={`p-5 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-slate-900 text-slate-100 rounded-tr-none border border-slate-800/80" 
                        : "bg-slate-900/45 text-slate-200 rounded-tl-none border border-slate-900"
                    } shadow-xl leading-relaxed`}>
                      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-200">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4.5 mr-auto max-w-md animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-teal-600/30 flex items-center justify-center text-white shrink-0">
                      <Sparkles className="w-4.5 h-4.5 animate-spin" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl rounded-tl-none shadow-xl">
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-bold">
                        <span className="w-2 h-2 bg-teal-400 rounded-full animate-ping"></span>
                        AI 전문 마이닝 엔진이 데이터를 심층 매핑하고 있습니다...
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            ) : (
              // Tabbed Layout for Step 4 (Complete results)
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
                {/* Visual tabs with sleek styling */}
                <div className="bg-slate-900/60 border-b border-slate-800/80 flex overflow-x-auto px-6 gap-1">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-5 py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === "profile" 
                        ? "border-teal-500 text-teal-400 bg-teal-950/20" 
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    구직자 프로파일 분석 (가~라)
                  </button>
                  <button
                    onClick={() => setActiveTab("recommendation")}
                    className={`px-5 py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === "recommendation" 
                        ? "border-teal-500 text-teal-400 bg-teal-950/20" 
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    맞춤 희망직종 & 비교 매트릭스 (마, 사)
                  </button>
                  <button
                    onClick={() => setActiveTab("tools")}
                    className={`px-5 py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === "tools" 
                        ? "border-teal-500 text-teal-400 bg-teal-950/20" 
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    질문지 50문항 & 스크립트 7종 (바, 자, 아)
                  </button>
                  <button
                    onClick={() => setActiveTab("report")}
                    className={`px-5 py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === "report" 
                        ? "border-teal-500 text-teal-400 bg-teal-950/20" 
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    공식 기록지 기록 서식 (차)
                  </button>
                </div>

                {/* Content Renderer */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-950/30">
                  <div className="max-w-4xl mx-auto bg-slate-900/20 border border-slate-800/80 rounded-2xl p-7 shadow-2xl relative">
                    {activeTab === "profile" && reportData && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
                          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-1.5 h-3.5 bg-teal-500 rounded-full"></span>
                            구직자 다각적 프로파일 종합 분석
                          </h2>
                          <button
                            onClick={() => copyToClipboard(reportData.tab1_profile)}
                            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
                            {isCopied ? "복사되었습니다!" : "내용 복사"}
                          </button>
                        </div>
                        <MarkdownRenderer content={reportData.tab1_profile} />
                      </div>
                    )}

                    {activeTab === "recommendation" && reportData && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
                          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-1.5 h-3.5 bg-teal-500 rounded-full"></span>
                            맞춤형 추천 직종 및 세부 의사결정 비교표
                          </h2>
                          <button
                            onClick={() => copyToClipboard(reportData.tab2_recommendation)}
                            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
                            {isCopied ? "복사되었습니다!" : "내용 복사"}
                          </button>
                        </div>
                        <MarkdownRenderer content={reportData.tab2_recommendation} />
                      </div>
                    )}

                    {activeTab === "tools" && reportData && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
                          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-1.5 h-3.5 bg-teal-500 rounded-full"></span>
                            현장 직무상담용 질문지 50문항 & 5단계 맞춤 시나리오 7선
                          </h2>
                          <button
                            onClick={() => copyToClipboard(reportData.tab3_tools)}
                            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
                            {isCopied ? "복사되었습니다!" : "내용 복사"}
                          </button>
                        </div>
                        <MarkdownRenderer content={reportData.tab3_tools} />
                      </div>
                    )}

                    {activeTab === "report" && reportData && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
                          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-1.5 h-3.5 bg-teal-500 rounded-full"></span>
                            국민취업지원제도 상담기록 전용 제출 서식
                          </h2>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(reportData.tab4_report)}
                              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
                              서식 복사
                            </button>
                            <button
                              onClick={downloadReportFile}
                              className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer shadow-md"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              서식 다운로드
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/60 font-mono text-xs overflow-x-auto leading-relaxed text-slate-300">
                          <MarkdownRenderer content={reportData.tab4_report} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form inputs at bottom tray */}
          {currentStep < 4 && (
            <div className="p-8 bg-slate-900/60 border-t border-slate-800/80 backdrop-blur-md">
              
              {/* Step 1 text box and uploader */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-400" />
                      1단계: 구직자의 프로파일 서류를 업로드 또는 직접 입력해 주십시오
                    </span>
                    <button
                      type="button"
                      onClick={loadSampleResume}
                      className="text-[11px] text-teal-400 font-bold hover:text-teal-300 hover:bg-teal-950/40 border border-teal-800/60 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      💡 원활한 확인을 위한 이력서 샘플 원클릭 입력
                    </button>
                  </div>

                  {/* Attached file chips */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-1">
                      {attachedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-800 border border-slate-700/80 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs">
                          <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                          <span className="font-bold max-w-[200px] truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-500">({file.size})</span>
                          <button 
                            onClick={() => removeFile(idx)} 
                            className="text-slate-400 hover:text-rose-400 font-bold ml-1.5 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative group">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="참여자의 이력서, 이력 요약, 자기소개서 등의 텍스트 내용을 직접 입력해 주시거나 아래 첨부버튼을 이용해 주십시오..."
                      disabled={isLoading}
                      className="w-full h-36 bg-slate-950 border border-slate-800 rounded-2xl p-5 pr-20 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none shadow-inner leading-relaxed"
                    />
                    <div className="absolute bottom-5 right-5 flex items-center gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".txt,.pdf,.docx,.hwp,.doc,.png,.jpg"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 text-teal-400" />
                        파일 업로드
                      </button>
                      <button
                        onClick={handleStep1Submit}
                        disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
                        className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/10 hover:shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
                      >
                        자료 분석
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 Form */}
              {currentStep === 2 && (
                <CurrentStatusForm onSubmit={handleStep2Submit} isLoading={isLoading} />
              )}

              {/* Step 3 Form */}
              {currentStep === 3 && (
                <CounselorNotesForm onSubmit={handleStep3Submit} isLoading={isLoading} />
              )}

              {errorMsg && (
                <div className="mt-4 flex items-center gap-2 bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl text-xs text-rose-400">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Panel: Side Guidelines */}
        <aside id="guidelines-panel" className="w-72 border-l border-slate-800 bg-slate-900/30 p-8 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-extrabold">실무 가이드라인</h2>
            
            <div className="space-y-5">
              <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[9.5px] text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  팁 01. 참여자 이력서 접수
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  참여자의 과거 실무 인턴 경험, 바리스타 등의 아르바이트 경력, 직업심리검사 점수 등을 자세히 입력해 주시면 최적의 결과를 추출합니다.
                </p>
              </div>

              <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[9.5px] text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  팁 02. 구직 제한 사유
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  돌봄 필요 여부나 거주 지역 등의 디테일을 정확하게 확보하면 이에 정확히 부합하는 정책 및 취업 훈련 전략을 엮어 드립니다.
                </p>
              </div>

              <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[9.5px] text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  팁 03. 리포트 출력 및 복사
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  마지막 3단계의 의견 전송이 끝난 직후 50문항의 질문지와 7종의 상황별 상담 시나리오가 실무 가이드로 고화질 일괄 인쇄됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
              <span className="text-[10.5px] text-slate-400 font-bold">통합 매핑 분석기 작동 중</span>
            </div>
            <p className="text-[10px] text-slate-600 font-mono">국취제 지능 엔진 v3.5-flash</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

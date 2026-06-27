export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface FileData {
  name: string;
  size: string;
  type: string;
  content: string;
}

export interface CurrentStatus {
  hasTargetJob: "yes" | "no";
  targetJobDetail: string; // 현재 희망하는 직종 또는 미선택 사유
  likes: string; // 하고 싶은 일 / 선호 업무
  dislikes: string; // 싫은 일 / 기피 업무
  strengths: string; // 자신 있는 일
  weaknesses: string; // 자신 없는 일
  workConditions: {
    salary: string; // 희망 임금
    location: string; // 희망 지역
    hours: string; // 근무 시간
  };
  healthRestrictions: string; // 건강상 제한 여부 및 내용
  canDrive: "yes" | "no"; // 운전 여부
  familySituation: string; // 가족상황/돌봄필요 여부
  primaryFactor: string; // 취업 시 가장 중요하게 생각하는 조건
}

export interface CounselorNotes {
  observation: string; // 상담 중 관찰한 특징
  communication: string; // 의사소통 방식
  realismLevel: string; // 직업 및 현실 인식 수준
  confidence: string; // 구직 자신감 및 취업 의지
  barrierFactors: string; // 직업선택을 방해하는 요인 (가족, 건강, 심리 등)
  counselorOpinion: string; // 상담사의 종합 의견
}

export interface ReportData {
  tab1_profile: string; // 기초자료 분석 (가, 나, 다, 라)
  tab2_recommendation: string; // 맞춤형 희망직종 추천 및 의사결정 비교표 (마, 사)
  tab3_tools: string; // 상담 질문지 50개, 상황별 스크립트 7가지, 추가 탐색전략 (바, 자, 아)
  tab4_report: string; // 최종 종합리포트 출력 (차)
}

export interface AnalyzeResponse {
  nextStep: number;
  message: string;
  reportData?: ReportData;
}

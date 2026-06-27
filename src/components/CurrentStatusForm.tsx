import React, { useState } from "react";
import { CurrentStatus } from "../types";

interface CurrentStatusFormProps {
  onSubmit: (data: CurrentStatus) => void;
  isLoading: boolean;
}

export function CurrentStatusForm({ onSubmit, isLoading }: CurrentStatusFormProps) {
  const [formData, setFormData] = useState<CurrentStatus>({
    hasTargetJob: "yes",
    targetJobDetail: "",
    likes: "",
    dislikes: "",
    strengths: "",
    weaknesses: "",
    workConditions: {
      salary: "",
      location: "",
      hours: "",
    },
    healthRestrictions: "",
    canDrive: "no",
    familySituation: "",
    primaryFactor: "직무 적성",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("work_")) {
      const field = name.replace("work_", "");
      setFormData((prev) => ({
        ...prev,
        workConditions: {
          ...prev.workConditions,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const fillSampleData = () => {
    setFormData({
      hasTargetJob: "yes",
      targetJobDetail: "행정 사무원 및 기획 사무직무 희망. 관련 자격증은 없으나 엑셀 활용 능력 보통 수준.",
      likes: "문서 작성 및 정보 정리, 다른 사람의 업무 보조 및 조율 역할 선호",
      dislikes: "영업성 외부 업무나 압박감이 심한 직접적 대면 판매 서비스 업무 기피",
      strengths: "꼼꼼하게 세부 내용을 확인하고 컴퓨터 워드/스프레드시트를 다루는 차분함",
      weaknesses: "빠르게 즉흥적인 결정을 내려야 하거나 낯선 사람과 빈번하게 마찰을 해결하는 일",
      workConditions: {
        salary: "월 220만 원 ~ 250만 원 선호",
        location: "서울 마포구/영등포구 인근 (대중교통 40분 이내)",
        hours: "평일 09:00 ~ 18:00 (야근 최소화 희망)",
      },
      healthRestrictions: "특별한 건강상 제약 없음. 약간의 거북목 증상 있으나 사무 업무 가능.",
      canDrive: "yes",
      familySituation: "부모님과 동거 중으로 직접적인 가사 및 보육 돌봄 부담 없음.",
      primaryFactor: "고용 안정성 및 워라밸",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 space-y-5 max-h-[500px] overflow-y-auto shadow-2xl">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-teal-500 rounded-full"></span>
          <h4 className="font-bold text-slate-100 text-sm">Step 2: 참여자 현재 상황 분석 정보</h4>
        </div>
        <button
          type="button"
          onClick={fillSampleData}
          className="text-[11px] text-teal-400 font-bold hover:text-teal-300 hover:bg-teal-950/40 border border-teal-800/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          💡 테스트용 데이터 자동 대입
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <label className="block text-xs font-semibold text-slate-400 mb-2">현재 명확한 희망 직종 보유 여부</label>
          <div className="flex gap-6">
            <label className="inline-flex items-center text-xs text-slate-200 cursor-pointer select-none">
              <input
                type="radio"
                name="hasTargetJob"
                value="yes"
                checked={formData.hasTargetJob === "yes"}
                onChange={handleChange}
                className="text-teal-500 focus:ring-teal-500 bg-slate-950 border-slate-800 mr-2.5 w-4 h-4"
              />
              있음 (특정 목표 직무 희망)
            </label>
            <label className="inline-flex items-center text-xs text-slate-200 cursor-pointer select-none">
              <input
                type="radio"
                name="hasTargetJob"
                value="no"
                checked={formData.hasTargetJob === "no"}
                onChange={handleChange}
                className="text-teal-500 focus:ring-teal-500 bg-slate-950 border-slate-800 mr-2.5 w-4 h-4"
              />
              없음 (미선택 또는 직무 탐색 필요)
            </label>
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {formData.hasTargetJob === "yes" ? "희망하는 구체적 직종 및 자격 수준" : "직종을 선택하지 못하는 구체적인 사유"}
          </label>
          <textarea
            name="targetJobDetail"
            value={formData.targetJobDetail}
            onChange={handleChange}
            required
            rows={2}
            placeholder={formData.hasTargetJob === "yes" ? "예: 일반 행정 사무직 및 공공기관 서무 보조 업무 희망" : "예: 하고 싶은 분야(예: 마케팅)는 있으나 비전공자라 첫 서류 시작도 두려움"}
            className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">하고 싶은 일 / 선호 업무</label>
          <textarea
            name="likes"
            value={formData.likes}
            onChange={handleChange}
            required
            rows={2.5}
            placeholder="예: 문서 정리 및 기획, 고객 의견을 정리하는 피드백 사무"
            className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">피하고 싶은 일 / 기피 직무</label>
          <textarea
            name="dislikes"
            value={formData.dislikes}
            onChange={handleChange}
            required
            rows={2.5}
            placeholder="예: 현장 영업, 개인 실적 압박이 매우 심한 서비스 직군"
            className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">자신 있는 일 / 강점 영역</label>
          <textarea
            name="strengths"
            value={formData.strengths}
            onChange={handleChange}
            required
            rows={2.5}
            placeholder="예: 성실한 약속 엄수, 정리 정돈, 경청 능력과 섬세함"
            className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">자신 없는 일 / 약점 보완 영역</label>
          <textarea
            name="weaknesses"
            value={formData.weaknesses}
            onChange={handleChange}
            required
            rows={2.5}
            placeholder="예: 급작스러운 갈등 상황 응대, 다수 앞에서 조리있게 말하기"
            className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-3 bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/50">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">희망 임금 수준</label>
            <input
              type="text"
              name="work_salary"
              value={formData.workConditions.salary}
              onChange={handleChange}
              placeholder="예: 월 230 ~ 250만 원"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">희망 근무 지역</label>
            <input
              type="text"
              name="work_location"
              value={formData.workConditions.location}
              onChange={handleChange}
              placeholder="예: 서울 마포구/영등포구"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">희망 근무 시간</label>
            <input
              type="text"
              name="work_hours"
              value={formData.workConditions.hours}
              onChange={handleChange}
              placeholder="예: 평일 09 ~ 18시 (주 40시간)"
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">건강상 제한 요소</label>
          <input
            type="text"
            name="healthRestrictions"
            value={formData.healthRestrictions}
            onChange={handleChange}
            placeholder="예: 특별히 없음 또는 손가락 관절 통증으로 반복 타이핑 제한"
            className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">운전 면허 및 실제 운전 가능성</label>
          <select
            name="canDrive"
            value={formData.canDrive}
            onChange={handleChange}
            className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 cursor-pointer"
          >
            <option value="yes" className="bg-slate-900">2종보통 이상 보유 (실제 운전 가능)</option>
            <option value="no" className="bg-slate-900">면허 미보유 또는 실제 운전 불가능</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">가족 상황 / 돌봄 필요 여부</label>
          <input
            type="text"
            name="familySituation"
            value={formData.familySituation}
            onChange={handleChange}
            placeholder="예: 독립 가구, 자녀 하원(17시) 돌봄 필요"
            className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">취업 시 최우선 조건</label>
          <select
            name="primaryFactor"
            value={formData.primaryFactor}
            onChange={handleChange}
            className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 cursor-pointer"
          >
            <option value="급여 수준" className="bg-slate-900">급여 수준 최우선</option>
            <option value="고용 안정성 및 워라밸" className="bg-slate-900">고용 안정성 및 워라밸 최우선</option>
            <option value="직무 적성 및 자아 실현" className="bg-slate-900">직무 적성 및 자아 실현 최우선</option>
            <option value="출퇴근 거리 및 시간" className="bg-slate-900">출퇴근 거리 및 시간 최우선</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-teal-600/10 hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            참여자 상황 요약 정리 및 다음 단계 로드 중...
          </>
        ) : (
          <>
            참여자 현재 상황 전송 및 3단계로 이동 ➜
          </>
        )}
      </button>
    </form>
  );
}

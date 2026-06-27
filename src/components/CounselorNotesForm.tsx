import React, { useState } from "react";
import { CounselorNotes } from "../types";

interface CounselorNotesFormProps {
  onSubmit: (data: CounselorNotes) => void;
  isLoading: boolean;
}

export function CounselorNotesForm({ onSubmit, isLoading }: CounselorNotesFormProps) {
  const [formData, setFormData] = useState<CounselorNotes>({
    observation: "",
    communication: "",
    realismLevel: "보통 (자신의 상태와 현실적 장벽을 일부 인지)",
    confidence: "보통 (취업 의지가 있으나 다소 소극적)",
    barrierFactors: "",
    counselorOpinion: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const fillSampleData = () => {
    setFormData({
      observation: "상담 내내 차분하고 정돈된 태도로 임함. 질문에 대해 명확하게 답변하려 노력하는 모습을 보이나 장기 미취업으로 인한 다소 위축된 태도가 관찰됨.",
      communication: "눈맞춤이 양호하고 경청 능력이 우수함. 본인의 의사를 조리 있게 표현하지만 자신의 주장보다는 타인의 배려나 의견에 잘 따르는 수동적인 양상을 보임.",
      realismLevel: "높음 (희망 조건과 실제 시장 상황의 불일치 부분을 이해하고 조율할 의향이 있음)",
      confidence: "보통 (구직활동에 성실히 응하고 있으나 본인의 역량에 확신이 부족하고 서류 탈락에 대한 심리적 두려움이 있음)",
      barrierFactors: "직접적인 실무 경력 부재, 엑셀/워드 실무 능력에 대한 막연한 두려움, 장기 공백기로 인한 구직 효능감 저하",
      counselorOpinion: "참여자는 매우 성실하고 안정적인 잠재 역량을 가지고 있으나 실무 경험 부족으로 소극적인 상태입니다. 따라서 문서 작성 기초 및 컴퓨터 활용 연계를 병행하여 역량을 보완하고, 국민내일배움카드 등을 활용한 실무 중심 단기 훈련 및 일경험 프로그램을 통한 직접적 실무 노출이 구직 효능감 회복과 최종 직업 안착에 큰 디딤돌이 될 것입니다.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 space-y-5 max-h-[500px] overflow-y-auto shadow-2xl">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-teal-500 rounded-full"></span>
          <h4 className="font-bold text-slate-100 text-sm">Step 3: 1회기 심층 직업상담 기록 통합</h4>
        </div>
        <button
          type="button"
          onClick={fillSampleData}
          className="text-[11px] text-teal-400 font-bold hover:text-teal-300 hover:bg-teal-950/40 border border-teal-800/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          💡 테스트용 상담 메모 자동 입력
        </button>
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-300 mb-1.5">상담 중 관찰한 특징 (행동, 외양, 상담 태도 등)</label>
          <textarea
            name="observation"
            value={formData.observation}
            onChange={handleChange}
            required
            rows={2.5}
            placeholder="예: 정중하고 침착한 자세로 상담에 집중하나, 장기 미취업으로 인해 미래 진로에 대해 다소 경직된 표정을 보임"
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1.5">의사소통 방식 및 언어 표현력</label>
          <textarea
            name="communication"
            value={formData.communication}
            onChange={handleChange}
            required
            rows={2.5}
            placeholder="예: 어휘 선택이 명확하며 질문에 대한 이해도와 집중도가 매우 높음. 피드백 수용 의사가 유연함"
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">직업 및 현실 인식 수준</label>
            <select
              name="realismLevel"
              value={formData.realismLevel}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 cursor-pointer"
            >
              <option value="매우 높음 (현실적인 노동시장 상황과 본인 강약을 정확히 일치)" className="bg-slate-900">매우 높음</option>
              <option value="높음 (희망 조건과 장벽을 이해하고 조율할 적극성 있음)" className="bg-slate-900">높음 (현실적 조율 의사 높음)</option>
              <option value="보통 (자신의 상태와 현실적 장벽을 일부 인지)" className="bg-slate-900">보통 (일부 직종 타협 의사 있음)</option>
              <option value="낮음 (노동시장과 무관한 과도한 조건 고집)" className="bg-slate-900">낮음</option>
              <option value="매우 낮음 (취업 현실 및 기업 환경에 대한 괴리가 큼)" className="bg-slate-900">매우 낮음</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">구직 자신감 및 취업 의지</label>
            <select
              name="confidence"
              value={formData.confidence}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 cursor-pointer"
            >
              <option value="매우 적극적 (취업동기가 뚜렷하고 적극 활동)" className="bg-slate-900">매우 적극적 (추진력 높음)</option>
              <option value="적극적 (장애요인이 있으나 적극 극복의지 있음)" className="bg-slate-900">적극적</option>
              <option value="보통 (취업 의지가 있으나 다소 소극적)" className="bg-slate-900">보통 (자신감 보완 필요)</option>
              <option value="낮음 (수동적이며 서류탈락에 대한 두려움)" className="bg-slate-900">낮음 (소극적 성향)</option>
              <option value="매우 낮음 (패배감 및 구직의지 상실 심각)" className="bg-slate-900">매우 낮음</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1.5">직업 선택 및 구직을 가로막는 장애요인</label>
          <textarea
            name="barrierFactors"
            value={formData.barrierFactors}
            onChange={handleChange}
            required
            rows={2.5}
            placeholder="예: 장기 이직 실패로 인한 자아효능감 하락, 실제 실무 기술 부족에 따른 면접 부담감"
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1.5">상담사 전언 및 종합 피드백 의견</label>
          <textarea
            name="counselorOpinion"
            value={formData.counselorOpinion}
            onChange={handleChange}
            required
            rows={3.5}
            placeholder="예: 참여자의 뛰어난 성실성과 섬세함을 높이 평가하여 국민내일배움카드 OA 훈련 및 국민취업지원제도 일경험 프로그램을 연결하는 단계를 조속히 적용해 자신감 극대화 전략 제안"
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-100 placeholder-slate-600 transition-all leading-relaxed"
          />
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
            종합 데이터 정밀 매핑 및 리포트 일괄 빌드 중...
          </>
        ) : (
          <>
            📝 분석 완료 및 종합 리포트 즉시 출력 ➜
          </>
        )}
      </button>
    </form>
  );
}

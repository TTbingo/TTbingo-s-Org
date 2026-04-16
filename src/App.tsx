import React, { useState, useEffect } from 'react';
import { BookOpen, Disc, RotateCcw, Library, ChevronRight, Info, Edit3, Sparkles, Loader2, Bookmark, FileText } from 'lucide-react';

// === Gemini API 配置 ===
const apiKey = process.env.GEMINI_API_KEY; // 运行环境将自动注入

// 指数退避重试的 fetch 函数
const fetchWithRetry = async (url: string, options: RequestInit, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

// === 核心数据：古今易学典籍目录 ===
const ancientBooks = [
  { name: '《周易》本经', author: '传为伏羲、文王、孔子', era: '上古至先秦', type: '易学总纲', desc: '含《易经》卦爻辞与《易传》(十翼)，一切义理与象数的根本源头。' },
  { name: '《焦氏易林》', author: '焦延寿', era: '西汉', type: '易学占卜', desc: '将六十四卦两两相重，演绎出4096种卦变，附有大量古奥繇词。' },
  { name: '《京氏易传》', author: '京房', era: '西汉', type: '六爻源头', desc: '纳甲筮法奠基之作。首将干支、五行、六亲纳入卦爻，创八宫卦说。' },
  { name: '《火珠林》', author: '传为麻衣道者', era: '唐宋', type: '六爻古籍', desc: '纳甲筮法里程碑。将京房理论通俗化，为流传至今的六爻预测法蓝本。' },
  { name: '《渊海子平》', author: '徐大升', era: '宋代', type: '子平八字', desc: '子平八字的宗祖之作。首次系统论述“四柱算命法”，以财官印食伤等格局论命，奠定了整个学科的理论框架。' },
  { name: '《梅花易数》', author: '邵雍', era: '北宋', type: '易学占卜', desc: '起卦方式极为灵活，可根据时间、数字、声音等外应起卦。' },
  { name: '《周易正义》', author: '孔颖达 等', era: '唐代', type: '易学义理', desc: '唐代官修“五经正义”之一，以王弼注为基础，为唐宋时期权威注本。' },
  { name: '《周易本义》', author: '朱熹', era: '南宋', type: '易学义理', desc: '宋代理学易学经典，强调“易本卜筮之书”，明清科举官方标准。' }
];

const modernBooks = [
  { name: '《周易尚氏学》', author: '尚秉和', type: '学术研究', desc: '象数派易学在近代的扛鼎之作，以深厚象数功底全新注解经传。' },
  { name: '《易学本体论》', author: '成中英', type: '哲学研究', desc: '借鉴西方诠释学方法，构建《周易》哲学的本体论新架构。' },
  { name: '《周易新说》', author: '陈继龙', type: '哲学比较', desc: '将《周易》与西方哲学（如怀特海哲学）进行深度比较与会通。' },
  { name: '《周易哲学研究》', author: '黄根生 等', type: '哲学研究', desc: '站在世界哲学高度，探讨《周易》哲学的解释方式与理论问题。' },
  { name: '《周易古筮考精解》', author: '尚秉和 (原著)', type: '占卜实践', desc: '对尚秉和经典著作的现代解读版本，帮助深入理解其占卜思想。' },
  { name: '《周易占筮学》', author: '章秋农', type: '占卜研究', desc: '被誉为“当代人撰写的第一部周易占筮学著作”，系统阐述占筮技术。' },
  { name: '《还本归宗-六爻预测指南》', author: '王炳中', type: '六爻应用', desc: '21世纪出版的实用六爻入门指南，适合当代读者学习传统预测术。' },
  { name: '《六爻预测学讲义》', author: '王虎应', type: '六爻应用', desc: '作者在六爻领域有很深造诣，其“象法”在国内首屈一指，理法严谨。' },
  { name: '《周易与预测学》', author: '邵伟华', type: '六爻入门', desc: '现代六爻入门经典，基础知识全面，非常适合初学者建立概念。' },
  { name: '《具体断六爻讲义》', author: '李洪成', type: '六爻应用', desc: '理论与实践结合的现代名篇，为具体事项预测提供清晰思路。' }
];

import { HEX_DICT } from './data/hexagrams';

const HexagramLine: React.FC<{ value: number, isBenGua: boolean }> = ({ value, isBenGua }) => {
  const isYang = value === 7 || value === 9;
  const isChanging = value === 6 || value === 9;
  let renderYang = isBenGua ? isYang : (isChanging ? !isYang : isYang);

  return (
    <div className="flex items-center justify-center my-[6px] h-4 relative">
      {renderYang ? (
        <div className="w-24 h-4 bg-[#1A1A1A] relative">
           {isBenGua && isChanging && <span className="absolute -right-6 text-[#D43F3F] font-sans font-bold text-xs">O</span>}
        </div>
      ) : (
        <div className="w-24 h-4 flex justify-between relative">
          <div className="w-[42%] h-full bg-[#1A1A1A]"></div>
          <div className="w-[42%] h-full bg-[#1A1A1A]"></div>
          {isBenGua && isChanging && <span className="absolute -right-6 text-[#D43F3F] font-sans font-bold text-xs">X</span>}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('divination'); 
  const [question, setQuestion] = useState(''); 
  const [lines, setLines] = useState<number[]>([]); 
  const [isTossing, setIsTossing] = useState(false);
  const [currentCoins, setCurrentCoins] = useState<(number | null)[]>([null, null, null]);
  
  // 解析结果状态
  const [hexagramData, setHexagramData] = useState<any>(null);
  const [aiReading, setAiReading] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const exportWord = () => {
    if (!hexagramData) return;
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'></head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1A1A; line-height: 1.6;">
        <h1 style="text-align: center; color: #D43F3F;">易理神机 - 占卜结果</h1>
        <p><strong>所求何事：</strong>${question || '近期运势'}</p>
        <p><strong>本卦：</strong>${hexagramData.benName}</p>
        <p><strong>变卦：</strong>${hexagramData.bianName}</p>
        <hr style="border: 1px solid #E5E2D9; margin: 20px 0;" />
        <h2 style="color: #1A1A1A;">古籍原旨：义理与象数考释</h2>
        <p style="white-space: pre-wrap;">${hexagramData.ancientText}</p>
        <hr style="border: 1px solid #E5E2D9; margin: 20px 0;" />
        <h2 style="color: #D43F3F;">AI 命理推演：实战断语</h2>
        <div style="white-space: pre-wrap;">${aiReading.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '易理神机-占卜结果.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 收藏状态
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('iching-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('iching-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (bookName: string) => {
    setFavorites(prev =>
      prev.includes(bookName)
        ? prev.filter(name => name !== bookName)
        : [...prev, bookName]
    );
  };

  // 摇卦逻辑
  const tossCoin = () => {
    if (lines.length >= 6 || isTossing) return;
    setIsTossing(true);
    setCurrentCoins([null, null, null]); 
    
    setTimeout(() => {
      const newCoins = [
        Math.random() > 0.5 ? 3 : 2,
        Math.random() > 0.5 ? 3 : 2,
        Math.random() > 0.5 ? 3 : 2
      ];
      const sum = newCoins.reduce((a, b) => a + b, 0);
      setCurrentCoins(newCoins);
      setLines(prev => [...prev, sum]);
      setIsTossing(false);
    }, 800); 
  };

  const resetDivination = () => {
    setLines([]);
    setCurrentCoins([null, null, null]);
    setHexagramData(null);
    setAiReading('');
    setAiError(false);
  };

  // 监听六爻摇完，触发解析和 AI 请求
  useEffect(() => {
    if (lines.length === 6) {
      processHexagram();
    }
  }, [lines]);

  const processHexagram = async () => {
    let benGuaBinary = '';
    let bianGuaBinary = '';

    // 注意：lines 数组的 idx 0 是底爻（初爻），一直到上爻
    lines.forEach(line => {
      benGuaBinary += (line === 7 || line === 9) ? '1' : '0';
      bianGuaBinary += (line === 7 || line === 6) ? '1' : '0';
    });

    const changingLinesCount = lines.filter(l => l === 6 || l === 9).length;
    
    // 获取 64 卦全本数据
    const benGuaData = HEX_DICT[benGuaBinary] || ['未知卦象', '数据异常，请重试', '数据异常，请重试', '请重新摇卦'];
    const bianGuaData = HEX_DICT[bianGuaBinary] || ['未知卦象', '', '', ''];
    
    const [benName, ancientYili, ancientXiangshu, fallbackPrac] = benGuaData;
    const bianName = bianGuaData[0];
    const targetQuestion = question.trim() || '近期的综合运势与发展';

    // 组装静态古文结果
    let ancientText = `此卦为【${benName}】。\n\n▶ 按《周易本义》与《周易正义》考释其义理：\n“${ancientYili}”\n\n▶ 结合《京氏易传》与《焦氏易林》的传统象数推演：\n“${ancientXiangshu}”\n\n`;
    if (changingLinesCount === 0) {
      ancientText += `✦ 卦中无变爻，《易经》主张“以本卦卦辞断之”，当前局势相对固化，宜遵从上述卦意，静守其道。`;
    } else {
      ancientText += `✦ 卦中有 ${changingLinesCount} 个变爻，暗流涌动。变卦为【${bianName}】，气机正在演变，需防微杜渐。`;
    }

    setHexagramData({ benName, bianName, ancientText, fallbackPrac, benGuaBinary, bianGuaBinary, changingLinesCount });
    
    // 调用 Gemini AI 进行深度定制解析
    fetchAIReading(benName, bianName, changingLinesCount, ancientYili, targetQuestion, fallbackPrac);
  };

  const fetchAIReading = async (benName: string, bianName: string, changingCount: number, yili: string, targetQuestion: string, fallbackPrac: string) => {
    setIsAiLoading(true);
    setAiError(false);
    
    const systemPrompt = `你是一位精通《周易》与现代预测学（如《还本归宗-六爻预测指南》）的易学大师。你的任务是根据用户摇出的卦象和他们【具体所求之事】，给出极其针对性、实用、通俗易懂的白话解答。不要照本宣科，绝对不能给出模棱两可的废话，必须把卦象的含义和用户的具体问题紧密结合！`;
    
    const userQuery = `
      用户所求之事：${targetQuestion}
      摇出本卦：${benName}
      变卦：${bianName}（${changingCount > 0 ? `有${changingCount}个变爻` : '无变爻'}）
      传统卦意参考：${yili}

      请结合以上信息，直接以大师的口吻告诉我：
      1. 【吉凶断定】：针对用户问的“${targetQuestion}”，目前的吉凶趋势是什么？为什么？
      2. 【实战建议】：针对这个具体问题，给出2-3条极其明确的行动建议（宜做说明，忌做什么）。
      排版要清晰易读，语气要专业、客观、真诚。
    `;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };

      const result = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAiReading(text);
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      setAiError(true);
      // 无缝回退到全库精准实战解析
      setAiReading(`【系统提示】：AI 深度推演遇到网络波动，已为您切换至《具体断六爻》等书目的基础实战断语：\n\n针对您所问之事，本卦明确提示：“${fallbackPrac}”\n\n${changingCount > 0 ? `当前走向变卦【${bianName}】，提醒您在此事的发展中途必然遇到性质的转变，需审时度势灵活调整。` : '当前无变动，建议平稳积累，勿要轻举妄动。'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // UI 组件渲染
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1A1A1A] font-sans selection:bg-[#E5E2D9] flex flex-col relative overflow-hidden">
      {/* 背景图：八卦/周易意象，若隐若现 */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]"
        style={{
          backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bagua_Early_Heaven.svg/1024px-Bagua_Early_Heaven.svg.png")',
          backgroundPosition: 'center',
          backgroundSize: '60vmin',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* 将原有内容包裹在 z-10 中以确保可交互 */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <header className="py-10 px-10 md:px-16 flex justify-between items-center border-b border-[#E5E2D9]">
        <div className="text-sm font-black tracking-[4px] uppercase">
          周易六爻
        </div>
        <nav className="flex gap-8">
          <button onClick={() => setActiveTab('divination')} className={`text-[11px] uppercase tracking-[2px] font-semibold transition-colors ${activeTab === 'divination' ? 'text-[#D43F3F]' : 'text-[#1A1A1A] hover:text-[#D43F3F]'}`}>起卦</button>
          <button onClick={() => setActiveTab('library')} className={`text-[11px] uppercase tracking-[2px] font-semibold transition-colors ${activeTab === 'library' ? 'text-[#D43F3F]' : 'text-[#1A1A1A] hover:text-[#D43F3F]'}`}>典籍</button>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-10 md:p-16">
        {/* 起卦占卜界面 */}
        {activeTab === 'divination' && (
          <div className="animate-fade-in">
            <div className="mb-16 flex flex-col items-center text-center">
              <span className="text-2xl text-[#D43F3F] font-bold uppercase tracking-[4px] mb-5 block">占卜</span>
              <div className="w-10 h-1 bg-[#D43F3F] mb-5"></div>
              <h1 className="font-serif text-6xl md:text-[88px] leading-[0.9] tracking-[-3px] mb-10">易理神机</h1>
              <p className="font-serif text-xl md:text-2xl leading-[1.4] text-[#4A4A4A] italic max-w-lg">探索古典易学直觉与现代算法精度之间的微妙交汇。</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16">
              <div className="flex flex-col justify-between">
                <div className="mb-10">
                  <label className="block text-[11px] font-bold uppercase tracking-[2px] mb-4 text-[#1A1A1A]">
                    所求何事
                  </label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={lines.length > 0}
                    placeholder="在此输入您的问题..."
                    className="w-full pb-3 border-b border-[#1A1A1A] bg-transparent focus:outline-none focus:border-[#D43F3F] disabled:opacity-50 transition-colors text-xl font-serif placeholder-[#AAA]"
                  />
                </div>

                {lines.length < 6 && (
                  <div className="py-6">
                    <div className="flex gap-6 mb-10 perspective-1000">
                      {[0, 1, 2].map(i => {
                        const val = currentCoins[i];
                        const isYang = val === 3;
                        const showFront = !isTossing && (val === 2 || val === null); 
                        
                        return (
                          <div key={i} className={`relative w-16 h-16 rounded-full flex items-center justify-center border border-[#1A1A1A] bg-[#FDFCF8] transition-transform duration-300 transform-style-3d ${isTossing ? 'animate-coin-flip' : ''}`}>
                            {showFront && (
                              <span className="font-serif text-xl font-bold text-[#1A1A1A]">阴</span>
                            )}
                            {!isTossing && isYang && (
                              <span className="font-serif text-xl font-bold text-[#1A1A1A]">阳</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={tossCoin} disabled={isTossing} className="px-8 py-4 bg-[#1A1A1A] hover:bg-[#D43F3F] text-white text-[11px] font-bold uppercase tracking-[2px] transition-colors disabled:opacity-50">
                      {isTossing ? '气机流转中...' : `掷第 ${lines.length + 1} 爻`}
                    </button>
                  </div>
                )}

                {lines.length === 6 && (
                  <div className="mt-8">
                     <button onClick={resetDivination} className="px-8 py-4 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-[11px] font-bold uppercase tracking-[2px] transition-colors">
                      重新起卦
                    </button>
                  </div>
                )}
              </div>

              <aside className="flex flex-col gap-8">
                <div className="flex gap-8">
                  {/* 本卦框 */}
                  <div className="flex flex-col w-full">
                    <h3 className="text-[11px] font-bold uppercase tracking-[2px] mb-4 text-[#1A1A1A] border-b border-[#E5E2D9] pb-2">本卦</h3>
                    <div className="flex flex-col-reverse justify-end p-6 bg-[#E5E2D9]/30 h-[240px] relative">
                      {lines.map((val, idx) => <HexagramLine key={`ben-${idx}`} value={val} isBenGua={true} />)}
                      {Array.from({length: 6 - lines.length}).map((_, i) => <div key={`empty-ben-${i}`} className="w-24 h-4 my-[6px] bg-transparent"></div>)}
                    </div>
                    {hexagramData ? <p className="mt-4 font-serif font-bold text-2xl text-[#1A1A1A]">{hexagramData.benName}</p> : <p className="mt-4 text-transparent select-none text-2xl">暂无</p>}
                  </div>
                  
                  {/* 变卦框 */}
                  <div className="flex flex-col w-full">
                    <h3 className="text-[11px] font-bold uppercase tracking-[2px] mb-4 text-[#1A1A1A] border-b border-[#E5E2D9] pb-2">变卦</h3>
                    <div className="flex flex-col-reverse justify-end p-6 bg-[#E5E2D9]/30 h-[240px] relative">
                      {lines.map((val, idx) => <HexagramLine key={`bian-${idx}`} value={val} isBenGua={false} />)}
                      {Array.from({length: 6 - lines.length}).map((_, i) => <div key={`empty-bian-${i}`} className="w-24 h-4 my-[6px] bg-transparent"></div>)}
                    </div>
                    {hexagramData ? <p className="mt-4 font-serif font-bold text-2xl text-[#1A1A1A]">{hexagramData.bianName}</p> : <p className="mt-4 text-transparent select-none text-2xl">暂无</p>}
                  </div>
                </div>
              </aside>
            </div>

            {/* 解读结果区 */}
            {hexagramData && (
              <div className="mt-16 space-y-12 animate-fade-in-up">
                
                {/* 导出按钮 */}
                <div className="flex justify-end gap-4">
                  <button onClick={exportWord} className="flex items-center gap-2 px-4 py-2 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-[11px] font-bold uppercase tracking-[2px] transition-colors">
                    <FileText size={14} /> 导出 Word
                  </button>
                </div>

                {/* 古籍考据 */}
                <div className="border-t border-[#1A1A1A] pt-8">
                  <span className="text-[12px] text-[#1A1A1A] font-bold uppercase tracking-[2px] mb-4 block">古籍原旨</span>
                  <h3 className="font-serif text-3xl mb-6">义理与象数考释</h3>
                  <div className="font-serif text-lg leading-[1.6] text-[#4A4A4A] whitespace-pre-wrap max-w-3xl">
                    {hexagramData.ancientText}
                  </div>
                </div>

                {/* AI 实战推演 */}
                <div className="border-t border-[#D43F3F] pt-8">
                  <span className="text-[12px] text-[#D43F3F] font-bold uppercase tracking-[2px] mb-4 block">AI 命理推演</span>
                  <h3 className="font-serif text-3xl mb-6">实战断语：<span className="italic">{question || '近期运势'}</span></h3>
                  <div className="font-serif text-lg leading-[1.6] text-[#1A1A1A] whitespace-pre-wrap max-w-3xl min-h-[120px]">
                    {isAiLoading ? (
                      <div className="flex flex-col items-start text-[#4A4A4A] py-4">
                        <Loader2 className="animate-spin mb-4" size={24} />
                        <p className="italic">正在结合古籍与现代语境进行推演...</p>
                      </div>
                    ) : (
                      <div dangerouslySetInnerHTML={{__html: aiReading.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')}} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 典籍库页面 */}
        {activeTab === 'library' && (
          <div className="animate-fade-in">
            <div className="mb-16 flex flex-col items-center text-center">
              <span className="text-2xl text-[#D43F3F] font-bold uppercase tracking-[4px] mb-5 block">藏书阁</span>
              <div className="w-10 h-1 bg-[#D43F3F] mb-5"></div>
              <h1 className="font-serif text-6xl md:text-[88px] leading-[0.9] tracking-[-3px] mb-10">易学典籍</h1>
              <p className="font-serif text-xl md:text-2xl leading-[1.4] text-[#4A4A4A] italic max-w-lg">汇聚历代易理、象数名篇及当代学术实战讲义，构筑算法神谕之基石。</p>
            </div>

            {/* 收藏夹 */}
            {favorites.length > 0 && (
              <div className="mb-16">
                <h3 className="text-[11px] font-bold uppercase tracking-[2px] mb-8 text-[#D43F3F] border-b border-[#D43F3F] pb-4 flex items-center gap-2">
                  <Bookmark size={14} fill="currentColor" /> 我的收藏
                </h3>
                <div className="grid lg:grid-cols-2 gap-x-16 gap-y-8">
                  {[...ancientBooks, ...modernBooks].filter(b => favorites.includes(b.name)).map((book, idx) => (
                    <div key={`fav-${idx}`} className="border-t border-[#E5E2D9] pt-6 group relative">
                      <button onClick={() => toggleFavorite(book.name)} className="absolute top-6 right-0 text-[#D43F3F] hover:text-[#1A1A1A] transition-colors">
                        <Bookmark fill="currentColor" size={18} />
                      </button>
                      <span className="text-[10px] uppercase tracking-[1px] text-[#D43F3F] mb-2 block">
                        {'era' in book ? `${book.era} / ` : ''}{book.type}
                      </span>
                      <h4 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-1">{book.name}</h4>
                      <p className="text-[12px] font-bold text-[#1A1A1A] mb-4">{book.author}</p>
                      <p className="font-serif text-sm leading-[1.6] text-[#4A4A4A]">{book.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-16">
              {/* 古籍列表 */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[2px] mb-8 text-[#1A1A1A] border-b border-[#1A1A1A] pb-4">历代核心原典</h3>
                <div className="space-y-8">
                  {ancientBooks.map((book, idx) => {
                    const isFav = favorites.includes(book.name);
                    return (
                      <div key={idx} className="border-t border-[#E5E2D9] pt-6 group relative">
                        <button onClick={() => toggleFavorite(book.name)} className={`absolute top-6 right-0 transition-colors ${isFav ? 'text-[#D43F3F]' : 'text-[#AAA] hover:text-[#1A1A1A]'}`}>
                          <Bookmark fill={isFav ? 'currentColor' : 'none'} size={18} />
                        </button>
                        <span className="text-[10px] uppercase tracking-[1px] text-[#D43F3F] mb-2 block">{book.era} / {book.type}</span>
                        <h4 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-1">{book.name}</h4>
                        <p className="text-[12px] font-bold text-[#1A1A1A] mb-4">{book.author}</p>
                        <p className="font-serif text-sm leading-[1.6] text-[#4A4A4A]">{book.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 现代籍列表 */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[2px] mb-8 text-[#1A1A1A] border-b border-[#1A1A1A] pb-4">现代学术诠释</h3>
                <div className="space-y-8">
                  {modernBooks.map((book, idx) => {
                    const isFav = favorites.includes(book.name);
                    return (
                      <div key={idx} className="border-t border-[#E5E2D9] pt-6 group relative">
                        <button onClick={() => toggleFavorite(book.name)} className={`absolute top-6 right-0 transition-colors ${isFav ? 'text-[#D43F3F]' : 'text-[#AAA] hover:text-[#1A1A1A]'}`}>
                          <Bookmark fill={isFav ? 'currentColor' : 'none'} size={18} />
                        </button>
                        <span className="text-[10px] uppercase tracking-[1px] text-[#D43F3F] mb-2 block">{book.type}</span>
                        <h4 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-1">{book.name}</h4>
                        <p className="text-[12px] font-bold text-[#1A1A1A] mb-4">{book.author}</p>
                        <p className="font-serif text-sm leading-[1.6] text-[#4A4A4A]">{book.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-6 px-10 md:px-16 flex justify-between items-end text-[11px] text-[#AAA] border-t border-[#E5E2D9] mt-16">
        <div>&copy; 2024 周易六爻推演系统</div>
        <div className="writing-vertical-rl uppercase tracking-[2px] text-[#1A1A1A] mb-2">探寻天机</div>
        <div>长安 / 洛阳 / 金陵</div>
      </footer>
      
      {/* CSS 动画 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes coinFlip { 0% { transform: rotateY(0deg) scale(1); } 50% { transform: rotateY(900deg) scale(1.15); } 100% { transform: rotateY(1800deg) scale(1); } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-coin-flip { animation: coinFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .writing-vertical-rl { writing-mode: vertical-rl; }
      `}} />
      </div>
    </div>
  );
}

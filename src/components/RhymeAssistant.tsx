import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  BookmarkPlus,
  Check,
  Copy,
  SlidersHorizontal,
  X,
  Volume2,
} from 'lucide-react';
import { RhymeResult } from '../types';
import { searchRhymes } from '../services/rhymeDictionary';

interface RhymeAssistantProps {
  initialWord?: string;
  onSaveToRhymeBank: (text: string) => void;
  onInsertWord: (word: string) => void;
  onClose?: () => void;
}

export const RhymeAssistant: React.FC<RhymeAssistantProps> = ({
  initialWord = 'night',
  onSaveToRhymeBank,
  onInsertWord,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialWord);
  const [activeTab, setActiveTab] = useState<'perfect' | 'near' | 'synonyms'>('perfect');
  const [syllableFilter, setSyllableFilter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  const [results, setResults] = useState<{
    perfect: RhymeResult[];
    near: RhymeResult[];
    synonyms: RhymeResult[];
  }>({
    perfect: [],
    near: [],
    synonyms: [],
  });

  useEffect(() => {
    if (initialWord) {
      setSearchTerm(initialWord);
      fetchResults(initialWord);
    }
  }, [initialWord]);

  const fetchResults = async (word: string) => {
    if (!word.trim()) return;
    setIsLoading(true);
    try {
      const res = await searchRhymes(word);
      setResults(res);
    } catch (e) {
      console.error('Error searching rhymes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(searchTerm);
  };

  const currentList = results[activeTab] || [];
  const filteredList = syllableFilter
    ? currentList.filter((item) => item.numSyllables === syllableFilter)
    : currentList;

  const handleCopy = (word: string) => {
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 1500);
  };

  return (
    <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Rhyme & Word Craft
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Word Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Type word to find rhymes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-16 py-1.5 bg-slate-950/80 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-2 py-0.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded text-[11px] font-semibold transition-colors"
          >
            Find
          </button>
        </form>

        {/* Tabs (Perfect, Near, Synonyms) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveTab('perfect')}
            className={`py-1 rounded text-center font-medium transition-colors ${
              activeTab === 'perfect'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Perfect ({results.perfect.length})
          </button>
          <button
            onClick={() => setActiveTab('near')}
            className={`py-1 rounded text-center font-medium transition-colors ${
              activeTab === 'near'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Near ({results.near.length})
          </button>
          <button
            onClick={() => setActiveTab('synonyms')}
            className={`py-1 rounded text-center font-medium transition-colors ${
              activeTab === 'synonyms'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Metaphors ({results.synonyms.length})
          </button>
        </div>

        {/* Syllable Filter Bar */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className="text-slate-500">Syllables:</span>
          {[null, 1, 2, 3].map((syl) => (
            <button
              key={syl ?? 'all'}
              onClick={() => setSyllableFilter(syl)}
              className={`px-2 py-0.5 rounded transition-colors ${
                syllableFilter === syl
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
              }`}
            >
              {syl === null ? 'All' : `${syl} syl`}
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Searching rhymes & meter...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p>No rhymes found for "{searchTerm}".</p>
            <p className="text-[11px] text-slate-600">
              Try searching a simpler base root word like "night", "sky", "time", or "rain".
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {filteredList.map((item, idx) => (
              <div
                key={idx}
                className="group inline-flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 pl-2.5 pr-1.5 py-1 rounded-md text-xs text-slate-200 transition-all shadow-sm"
              >
                <span
                  onClick={() => onInsertWord(item.word)}
                  className="cursor-pointer hover:text-sky-300 font-medium"
                  title={`Insert "${item.word}" into lyrics`}
                >
                  {item.word}
                </span>

                <span
                  className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 py-0.2 rounded border border-slate-800"
                  title={`${item.numSyllables} syllables`}
                >
                  {item.numSyllables}s
                </span>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(item.word)}
                    className="p-0.5 text-slate-400 hover:text-white"
                    title="Copy Word"
                  >
                    {copiedWord === item.word ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onSaveToRhymeBank(item.word)}
                    className="p-0.5 text-slate-400 hover:text-sky-400"
                    title="Save to Rhyme Bank"
                  >
                    <BookmarkPlus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Quick Hints */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-400">
        💡 Double-click any word in your lyric sheet to instantly search rhymes here.
      </div>
    </div>
  );
};

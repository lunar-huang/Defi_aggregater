import React, { useEffect, useState } from 'react';
import { fetchBeefyVaultData } from './beefy';
import { FaSearch, FaSortUp, FaSortDown } from 'react-icons/fa';
import { buildIconFallbackList } from '../utils/tokenIconPaths';
import { iconLayout } from '../utils/iconLayout';
import { useNavigate } from 'react-router-dom';

export const sortFields = ['CURRENT APY', 'DAILY', 'TVL'] as const;
export type SortField = typeof sortFields[number];

type Vault = {
  id: string;
  name: string;
  chain: string;
  assets: string[];
  apy: string;
  daily: string;
  tvl: string;
  tags: string[];
  category: string;
};

const toNumber = (v: unknown) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[$,%]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
};

const formatApy = (val: string | number) => {
  const num = toNumber(val);
  if (isNaN(num)) return 'N/A';
  if (Math.abs(num) > 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  return num.toFixed(2);
};

const formatDaily = (val: string | number) => {
  const num = toNumber(val);
  if (isNaN(num)) return 'N/A';
  if (Math.abs(num) > 1e6) {
    return (num / 1e6).toFixed(4) + 'M';
  }
  return num.toFixed(4);
};

const formatTvl = (val: string | number) => {
  const num = toNumber(val);
  if (isNaN(num)) return 'N/A';
  if (Math.abs(num) > 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  return Math.round(num).toString();
};

const getChainIconUrl = (chain: string) =>
  `/images/networks/${chain}.svg`;

type Props = {
  selectedChains: string[];
  selectedCategory: string | null;
  search: string;
  sortField: SortField | null;
  minimumTvl: number;
  setSearch: (val: string) => void;
  setSortField: (val: SortField | null) => void;
  setMinimumTvl: (val: number) => void;
  showEol: boolean;
};

export const VaultCardList: React.FC<Props> = ({
  selectedChains,
  selectedCategory,
  search,
  sortField,
  minimumTvl,
  setSearch,
  setSortField,
  setMinimumTvl,
  showEol
}) => {
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => { fetchBeefyVaultData().then(setVaults); }, []);

  // 排序按钮点击逻辑：第三次点击取消排序
  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      if (!sortAsc) {
        setSortAsc(true);
      } else {
        setSortField(null);
        setSortAsc(false);
      }
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const shown = vaults
    .filter(v => {
      if (!showEol && v.tags.includes('EOL')) return false;
      return (
        v.name.toLowerCase().includes(search.toLowerCase()) &&
        (selectedChains.length === 0 || selectedChains.includes(v.chain)) &&
        (!selectedCategory || v.category === selectedCategory)
      );
    })
    .filter(v =>
      v.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedChains.length === 0 || selectedChains.includes(v.chain)) &&
      (!selectedCategory || v.category === selectedCategory) &&
      toNumber(v.tvl) >= minimumTvl &&
      (showEol || !v.tags.includes('EOL'))
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      let aV = 0, bV = 0;
      switch (sortField) {
        case 'CURRENT APY': aV = toNumber(a.apy);   bV = toNumber(b.apy);   break;
        case 'DAILY':       aV = toNumber(a.daily); bV = toNumber(b.daily); break;
        case 'TVL':         aV = toNumber(a.tvl);   bV = toNumber(b.tvl);   break;
        default: return 0;
      }
      return sortAsc ? aV - bV : bV - aV;
    });

  return (
    <div className="space-y-4 relative z-10">
      {/* 搜索 + 排序 */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1e293b] px-4 py-3 rounded-lg text-slate-300 text-sm">
        {/* 搜索框 */}
        <div className="flex items-center bg-[#0f172a] px-3 py-1.5 rounded-md w-full md:w-80">
          <FaSearch className="text-slate-500 mr-2" />
          <input
            placeholder="Search by asset name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-white placeholder-slate-500"
          />
        </div>
        {/* 排序字段 */}
        <div className="flex gap-12 flex-wrap justify-end w-full md:w-auto">
          {sortFields.map(f => (
            <button
              key={f}
              onClick={() => handleSortClick(f)}
              className={`flex items-center gap-2 px-3 py-1 rounded-md border border-slate-600 
                          hover:text-white hover:border-white transition-all
                          ${sortField === f ? 'text-white font-semibold bg-slate-700' : 'text-slate-400'}`}
            >
              <span>{f}</span>
              <div className="flex flex-col text-xs leading-none">
                <FaSortUp
                  className={sortField === f && sortAsc ? 'text-white' : 'text-slate-500'}
                />
                <FaSortDown
                  className={sortField === f && !sortAsc && sortField === f ? 'text-white' : 'text-slate-500'}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 卡片列表 */}
      <div className="relative z-0 space-y-4">
        {shown.map(v => (
          <div key={v.id}
            onClick={() => navigate(`/vault/${v.id}`)}
            className="relative flex items-center justify-between bg-[#1e293b] text-white
               rounded-lg px-4 py-3 shadow hover:shadow-lg transition
               cursor-pointer hover:-translate-y-0.5" >
            {/* 链图标 */}
            <img
              src={getChainIconUrl(v.chain)}
              onError={e => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = 'true';
                  img.src = '/images/networks/default.svg';
                }
              }}
              alt={v.chain}
              className="absolute top-2 left-2 w-4 h-4"
            />

            {/* 左侧信息 */}
            <div className="flex items-center gap-4 w-1/2 pl-4">
              {/* 资产图标组 */}
              <div className="relative" style={{ width: 40, height: 40 }}>
                {v.assets.slice(0, 4).map((sym: string, idx: number) => {
                  const paths = buildIconFallbackList(v.chain, sym);
                  const { translate, z, size } = iconLayout(v.assets.length, idx);
                  return (
                    <img
                      key={sym}
                      src={paths[0]}
                      data-fallback={JSON.stringify(paths.slice(1))}
                      onError={e => {
                        const img = e.currentTarget as HTMLImageElement;
                        const list = JSON.parse(img.dataset.fallback || '[]') as string[];
                        if (list.length) {
                          img.src = list.shift()!;
                          img.dataset.fallback = JSON.stringify(list);
                        }
                      }}
                      alt={sym}
                      style={{
                        position: 'absolute',
                        width: size,
                        height: size,
                        translate,
                        zIndex: z,
                      }}
                      className="rounded-full object-contain bg-[#1e2537] ring-1 ring-[#1e2537]"
                    />
                  );
                })}
              </div>
              {/* 名称 & 标签 */}
              <div>
                <div className="text-base font-semibold">{v.name}</div>
                <div className="flex gap-2 mt-1 text-xs">
                  {v.tags.map(t => (
                    <span key={t} className="bg-slate-700 px-2 py-0.5 rounded-full capitalize">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧数值 */}
            <div className="flex gap-10 w-1/2 justify-end text-sm text-right">
              <div className="w-28 text-yellow-400 font-semibold" title={v.apy}>
                {formatApy(v.apy)}%
              </div>
              <div className="w-28 text-green-400" title={v.daily}>
                {formatDaily(v.daily)}%
              </div>
              <div className="w-28" title={v.tvl}>
                ${formatTvl(v.tvl)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// 负责人：A
// 左侧导航 + 四视图切换入口

import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/timeline', label: '时间轴', icon: '🕒' },
  { to: '/people', label: '人物', icon: '👤' },
  { to: '/map', label: '地图', icon: '🗺' },
  { to: '/search', label: '搜索', icon: '🔍' },
  { to: '/albums', label: '相册', icon: '📚' },
]

export default function Sidebar() {
  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-white/5 bg-slate-900/60 p-3">
      <div className="mb-6 px-2 pt-2">
        <div className="text-lg font-semibold tracking-wide">拾忆</div>
        <div className="text-xs text-slate-500">个人影像管理</div>
      </div>

      <ul className="space-y-1">
        {NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mt-auto rounded-md bg-slate-800/60 p-3 text-[11px] leading-relaxed text-slate-500">
        四个视图对应四种索引：
        <br />
        时间 / 人物 / 地点 / 内容
      </div>
    </nav>
  )
}
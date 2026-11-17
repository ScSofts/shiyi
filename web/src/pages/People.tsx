// 负责人：B
// 人物页：人脸聚类出来的人物卡片
// TODO(B): 把 mockPeople 换成 api('/people')

import { Link } from 'react-router-dom'

import { mockPeople } from '../mocks/assets'

const COLORS = ['#5b6b8c', '#8c7a5b', '#5b8c74', '#7a5b8c', '#8c5b6b']

export default function People() {
  return (
    <div className="p-6">
      <header className="mb-5">
        <h1 className="text-xl font-medium">人物</h1>
        <p className="text-xs text-slate-500">系统自动识别人脸并归类，点击可以命名</p>
      </header>

      {mockPeople.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">还没有识别出人物，先上传一些带人脸的合影</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
          {mockPeople.map((person, i) => (
            <Link
              key={person.id}
              to={`/people/${person.id}`}
              className="group flex flex-col items-center rounded-xl bg-slate-800/50 p-4 hover:bg-slate-800"
            >
              <div
                className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-2xl text-white/70"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              >
                👤
              </div>
              <div className="text-sm text-slate-200">{person.name ?? '未命名人物'}</div>
              <div className="text-xs text-slate-500">{person.faceCount} 张</div>
              {person.name === null ? (
                <span className="mt-2 rounded bg-indigo-600/20 px-2 py-0.5 text-[11px] text-indigo-300">待命名</span>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
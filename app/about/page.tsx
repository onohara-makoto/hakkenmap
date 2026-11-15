import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import s from './about.module.css'

export const metadata: Metadata = {
  title: 'hakkenmap | 公園に、「これ」を見にいこう',
  description:
    '散歩中に見つけた草花・虫・きのこを写真で記録。見つけた発見が、あなたの地図と図鑑になります。',
}

function Logo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" width="33" height="38">
      <path d="M24 43S8 30 8 19a16 16 0 1 1 32 0c0 11-16 24-16 24Z" stroke="#294936" strokeWidth="2.7" />
      <path
        d="M24 29V17m0 6c-9 0-11-6-10-10 7-1 11 3 10 10Zm0-3c0-7 4-10 10-10 1 6-3 10-10 10Z"
        stroke="#294936"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StartButton() {
  return (
    <Link className="cta" href="/login">
      <span className="g" aria-hidden="true">G</span>
      Googleではじめる
      <span className="arrow" aria-hidden="true">↗</span>
    </Link>
  )
}

export default function AboutPage() {
  return (
    <div className={s.lp}>
      <div className="wrap">
        <header>
          <Link className="brand" href="/about" aria-label="hakkenmap ホーム">
            <Logo />
            hakkenmap
          </Link>
          <nav className="nav" aria-label="メイン">
            <a href="#how">楽しみかた</a>
            <Link className="login" href="/login">はじめる ↗</Link>
          </nav>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">いつもの散歩に、小さな目的を。</p>
              <p className="intro">
                足もとの花。葉っぱに隠れた虫。<br />
                木陰で出会う、不思議なきのこ。<br />
                その発見が、あなたの地図と図鑑になる。
              </p>
              <StartButton />
              <p className="under">スマホの写真からはじめる、散歩の記録。</p>
            </div>
            <div className="hero-art">
              <div className="photo-wrap">
                <Image
                  className="main-photo"
                  src="/lp/forest-mushroom-portrait.jpg"
                  alt="森の苔の上から伸びるきのこを、下から見上げた写真"
                  width={1000}
                  height={1333}
                  sizes="(max-width: 900px) 92vw, 520px"
                  preload
                />
                <h1>
                  公園に、<br />
                  <span>「これ」</span>を見にいこう。
                </h1>
              </div>
              <span className="photo-tag">目線を変えると、出会いがある。</span>
              <div className="mini-photo">
                <Image
                  src="/lp/violet.jpg"
                  alt="落ち葉の間に咲く紫色の花"
                  width={1000}
                  height={1333}
                  sizes="150px"
                />
                <p>足もとにも、春の色。</p>
              </div>
              <span className="annotation">散歩で出会った、小さな世界。</span>
            </div>
          </section>

          <div className="divider-note">
            <span>花も、虫も、きのこも。</span>
            <span>見つける → 撮る → ためる</span>
          </div>

          <section className="discover">
            <div className="section-head">
              <div>
                <p className="eyebrow">小さな発見の入り口</p>
                <h2>通りすぎていた景色に、<br />会いたいものが増えていく。</h2>
              </div>
              <p>
                「こんなの、見つけてみたい。」<br />
                そう思ったら、次の散歩はもう少し楽しい。
              </p>
            </div>
            <div className="specimens">
              <figure className="specimen">
                <Image src="/lp/violet.jpg" alt="落ち葉と草の間に咲く、小さな紫の花" width={1000} height={1333} sizes="(max-width: 900px) 90vw, 330px" />
                <figcaption><strong>足もとの、花。</strong><small>しゃがんで、ひとつ。</small></figcaption>
              </figure>
              <figure className="specimen">
                <Image src="/lp/hagoromo-insect.jpg" alt="植物にとまっている小さな虫" width={1000} height={750} sizes="(max-width: 900px) 90vw, 400px" />
                <figcaption><strong>葉かげの、虫。</strong><small>そっと、近づいて。</small></figcaption>
              </figure>
              <figure className="specimen">
                <Image src="/lp/mushroom-orange-log.jpg" alt="木に生えたオレンジ色のきのこ" width={900} height={1200} sizes="(max-width: 900px) 90vw, 330px" />
                <figcaption><strong>木陰の、きのこ。</strong><small>雨のあとも、楽しみ。</small></figcaption>
              </figure>
            </div>
          </section>
        </main>
      </div>

      <section className="how" id="how" aria-labelledby="how-title">
        <div className="wrap">
          <p className="eyebrow">hakkenmap の楽しみかた</p>
          <h2 id="how-title">「見つけた！」を、そのまま記録。</h2>
          <div className="steps">
            <article className="step">
              <span className="step-num">01</span>
              <h3>気になったら、撮る。</h3>
              <p>散歩で見つけた花・虫・きのこを写真に。帰ってから、複数枚をまとめて登録できます。</p>
            </article>
            <article className="step">
              <span className="step-num">02</span>
              <h3>名前を、一緒に探す。</h3>
              <p>写真からAIが名前の候補を提案。候補を見比べて、選ぶのはあなたです。</p>
              <small>AIの候補は、正しいとは限りません。</small>
            </article>
            <article className="step">
              <span className="step-num">03</span>
              <h3>出会った場所も、残す。</h3>
              <p>写真に位置情報があれば、場所は自動で入力。発見を地図と図鑑にためていけます。</p>
              <small>場所の自動取得は日本国内に対応。</small>
            </article>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="collection">
          <div className="book" role="img" aria-label="写真を主役にした図鑑のイメージ">
            <div className="book-top">わたしの発見ノート<span>図鑑のイメージ</span></div>
            <div className="book-grid">
              <div>
                <Image src="/lp/violet.jpg" alt="" width={1000} height={1333} sizes="(max-width: 900px) 42vw, 230px" />
                <p>花の記録</p>
              </div>
              <div>
                <Image src="/lp/hagoromo-insect.jpg" alt="" width={1000} height={750} sizes="(max-width: 900px) 42vw, 230px" />
                <p>虫の記録</p>
              </div>
              <div>
                <Image src="/lp/forest-mushroom-portrait.jpg" alt="" width={1000} height={1333} sizes="(max-width: 900px) 42vw, 230px" />
                <p>きのこの記録</p>
              </div>
              <div>
                <Image src="/lp/mushroom-orange-log.jpg" alt="" width={900} height={1200} sizes="(max-width: 900px) 42vw, 230px" />
                <p>きのこの記録</p>
              </div>
            </div>
            <p className="book-note">掲載写真は実際の散歩で撮影されたものです。</p>
          </div>
          <div className="collection-copy">
            <p className="eyebrow">散歩のあとにも、楽しみを。</p>
            <h2>歩いたぶんだけ、<br />自分だけの図鑑になる。</h2>
            <p>
              写真を眺めたり、地図で場所を振り返ったり。<br />
              小さな発見をためるほど、<br />
              いつもの公園が、少し違って見えてくる。
            </p>
            <div className="feature-line"><b>地図</b><span>出会った場所を振り返る</span></div>
            <div className="feature-line"><b>図鑑</b><span>写真を主役に、発見を眺める</span></div>
            <div className="feature-line"><b>散歩ログ</b><span>今月の発見数や連続日数を振り返る</span></div>
          </div>
        </section>

        <section className="closing">
          <p className="eyebrow">次の散歩は、何に会おう。</p>
          <h2>最初のひとつを、見つけに。</h2>
          <p>いつもの公園から、あなたの hakkenmap を。</p>
          <StartButton />
        </section>

        <aside className="privacy" aria-label="データの取り扱い">
          <h2>写真と位置情報について</h2>
          <p>
            名前の候補を出すため、写真はAI（Google Gemini）に送信されます。<br />
            場所の自動取得では、写真の位置情報の座標を丸めて国土地理院に照会します（日本国内のみ）。<br />
            地図はOpenStreetMapを使用しています。
          </p>
        </aside>

        <footer>
          <Link href="/about" className="brand">
            <Logo />
            hakkenmap
          </Link>
          <small>小さな発見が、散歩を変える。</small>
        </footer>
      </div>
    </div>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/size-guide.css'

type SizeGuideProps = { department: string; productId: string; sizes: string[] }
type SizeChart = { title: string; caption: string; headers: string[]; rows: string[][]; instructions: string }

const womenClothing: SizeChart = {
  title: 'Women’s clothing', caption: 'Body measurements in centimeters',
  headers: ['Size', 'Bust (cm)', 'Waist (cm)', 'Hips (cm)'],
  rows: [['XS', '80–84', '60–64', '86–90'], ['S', '84–88', '64–68', '90–94'], ['M', '88–94', '68–74', '94–100'], ['L', '94–100', '74–80', '100–106'], ['XL', '100–106', '80–86', '106–112']],
  instructions: 'Keep a tape measure level and comfortably loose. Measure the fullest part of your bust and hips, and the narrowest part of your waist.',
}
const menClothing: SizeChart = {
  title: 'Men’s clothing', caption: 'Body measurements in centimeters',
  headers: ['Size', 'Chest (cm)', 'Waist (cm)', 'Hips (cm)'],
  rows: [['S', '90–96', '76–82', '92–98'], ['M', '96–102', '82–88', '98–104'], ['L', '102–108', '88–94', '104–110'], ['XL', '108–114', '94–100', '110–116'], ['XXL', '114–120', '100–106', '116–122']],
  instructions: 'Keep a tape measure level and comfortably loose. Measure the fullest part of your chest and hips, and around your natural waist.',
}
const womenTrousers: SizeChart = {
  title: 'Women’s trousers', caption: 'Body measurements and sample garment inseam in centimeters',
  headers: ['Size', 'Waist (cm)', 'Hips (cm)', 'Inseam (cm)'],
  rows: [['XS', '60–64', '86–90', '78'], ['S', '64–68', '90–94', '78'], ['M', '68–74', '94–100', '79'], ['L', '74–80', '100–106', '79'], ['XL', '80–86', '106–112', '80']],
  instructions: 'Measure your natural waist and the fullest part of your hips. For inseam, measure a well-fitting pair of trousers from the crotch seam to the hem.',
}
const menTrousers: SizeChart = {
  title: 'Men’s trousers & denim', caption: 'Waist label sizes with body measurements and sample garment inseam in centimeters',
  headers: ['Size', 'Waist (cm)', 'Hips (cm)', 'Inseam (cm)'],
  rows: [['30', '76–79', '92–96', '80'], ['32', '81–84', '97–101', '81'], ['34', '86–89', '102–106', '82'], ['36', '91–94', '107–111', '82'], ['38', '96–99', '112–116', '83']],
  instructions: 'Measure around your waist where the trousers sit, and the fullest part of your hips. Compare the sample inseam with a well-fitting pair measured from crotch seam to hem.',
}
const womenFootwear: SizeChart = {
  title: 'Women’s footwear', caption: 'EU sizes and approximate foot length in centimeters',
  headers: ['EU size', 'Foot length (cm)'],
  rows: [['36', '22.5–23.0'], ['37', '23.1–23.7'], ['38', '23.8–24.3'], ['39', '24.4–25.0'], ['40', '25.1–25.7'], ['41', '25.8–26.3']],
  instructions: 'Stand with your heel against a wall and measure to the end of your longest toe. Measure both feet and use the longer measurement. These are foot lengths, not insole lengths.',
}
const menFootwear: SizeChart = {
  title: 'Men’s footwear', caption: 'EU sizes and approximate foot length in centimeters',
  headers: ['EU size', 'Foot length (cm)'],
  rows: [['40', '25.0–25.6'], ['41', '25.7–26.2'], ['42', '26.3–26.9'], ['43', '27.0–27.6'], ['44', '27.7–28.2'], ['45', '28.3–28.9']],
  instructions: womenFootwear.instructions,
}

function SizeGuide({ department, productId, sizes }: SizeGuideProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const men = department === 'Men'
  const footwear = productId.includes('sneakers')
  const trousers = ['wide-leg-trousers', 'straight-leg-chinos', 'classic-denim-jeans'].includes(productId)
  const chart = footwear ? (men ? menFootwear : womenFootwear) : trousers ? (men ? menTrousers : womenTrousers) : (men ? menClothing : womenClothing)
  const rows = chart.rows.filter((row) => sizes.includes(row[0]))

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isOpen])

  function openGuide() {
    if (!dialogRef.current || dialogRef.current.open) return
    dialogRef.current.showModal()
    setIsOpen(true)
    closeRef.current?.focus()
  }

  const dialog = (
    <dialog
      ref={dialogRef}
      className="size-guide__dialog"
      id={id}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-note`}
      onClose={() => { setIsOpen(false); triggerRef.current?.focus() }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
          event.currentTarget.close()
        }
      }}
    >
      <header className="size-guide__header">
        <div>
          <p className="size-guide__eyebrow">FASHION / Finding your fit</p>
          <h2 id={`${id}-title`}>{chart.title} size guide</h2>
        </div>
        <button ref={closeRef} className="size-guide__close" type="button" aria-label="Close size guide" onClick={() => dialogRef.current?.close()}>×</button>
      </header>
      <p className="size-guide__note" id={`${id}-note`}>General guide only. These are realistic sample measurements, not verified specifications for this product. Fit can vary by style and brand.</p>
      <div className="size-guide__table-wrap" role="region" aria-label="Size measurement table, scroll horizontally if needed" tabIndex={0}>
        <table>
          <caption>{chart.caption}</caption>
          <thead><tr>{chart.headers.map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={index}>{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <section className="size-guide__instructions" aria-labelledby={`${id}-measure-title`}>
        <h3 id={`${id}-measure-title`}>How to measure</h3>
        <p>{chart.instructions}</p>
        <p>{footwear ? 'Between sizes? Compare the larger size and the product fit notes.' : 'Between sizes? Use the roomier measurement as a starting point, then check the product fit notes.'}</p>
      </section>
    </dialog>
  )

  return (
    <>
      <button className="size-guide__trigger" ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={id} onClick={openGuide}>Size guide</button>
      {typeof document !== 'undefined' && createPortal(dialog, document.body)}
    </>
  )
}

export default SizeGuide

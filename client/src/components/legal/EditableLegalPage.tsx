import { useContent } from '../../context/ContentContext'
import { bodyToSections, slugify } from '../../data/content-utils'
import LegalPageLayout from './LegalPageLayout'

function EditableLegalPage({ documentKey }: { documentKey: 'privacy' | 'terms' }) {
  const { data } = useContent()
  const document = data.legal[documentKey]
  return <LegalPageLayout title={document.title} intro={document.intro} number={documentKey === 'privacy' ? '01' : '02'} sections={bodyToSections(document.body).map((section, index) => ({ id: `${documentKey}-${index}-${slugify(section.heading)}`, title: section.heading, content: <>{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</> }))} />
}
export default EditableLegalPage

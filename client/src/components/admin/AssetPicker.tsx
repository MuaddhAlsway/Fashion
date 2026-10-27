import { useId } from 'react'
import { assetOptions } from '../../data/assets'

function AssetPicker({ value, onChange, label = 'Image asset' }: { value: string; onChange: (value: string) => void; label?: string }) {
  const id = useId()
  return <div className="admin-asset-picker"><label htmlFor={id}>{label}<select id={id} value={value} required onChange={event => onChange(event.target.value)}><option value="">Choose a local asset</option>{assetOptions.map(asset => <option key={asset.name} value={asset.url}>{asset.name}</option>)}</select></label>{value && <img loading="lazy" decoding="async" src={value} alt="Selected asset preview" />}</div>
}
export default AssetPicker

export function MapDisplayControlGroup({ children, legend }) {
  return (
    <fieldset className="m-0 border border-line p-2">
      <legend className="px-1">{legend}</legend>
      <div className="flex gap-1.5 *:min-w-0 *:flex-1">{children}</div>
    </fieldset>
  )
}

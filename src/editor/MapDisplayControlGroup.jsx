export function MapDisplayControlGroup({ children, legend }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="flex gap-1.5 *:min-w-0 *:flex-1">{children}</div>
    </fieldset>
  )
}

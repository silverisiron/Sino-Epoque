export function ChoiceInput({
  checked,
  children,
  name,
  onChange,
  type = 'radio',
  value,
}) {
  return (
    <label className={`button-choice ${checked ? 'bg-ink text-white' : 'bg-white'}`}>
      <input
        className="sr-only"
        checked={checked}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
      />
      {children}
    </label>
  )
}

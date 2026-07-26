export function ChoiceInput({
  checked,
  children,
  name,
  onChange,
  type = 'radio',
  value,
}) {
  return (
    <label
      className={`grid min-h-8 min-w-0 cursor-pointer place-items-center text-center text-sm focus-within:outline-2 focus-within:outline-offset-2 ${checked ? 'bg-ink text-white' : 'bg-white'}`}
    >
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

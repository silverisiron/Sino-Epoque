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
      className={`grid min-h-8 min-w-0 place-items-center text-center text-sm cursor-pointer`}
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

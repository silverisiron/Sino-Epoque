export function SelectAllButton({ onToggle }) {
  return (
    <button className="justify-self-end" type="button" onClick={onToggle}>
      모두 선택/해제
    </button>
  )
}

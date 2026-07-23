export function ModalSaveAlert({ visible }) {
  return visible ? (
    <p
      className="border border-[#7a9b82] bg-[#edf6ef] px-2.5 py-2 text-[#245c32]"
      role="status"
    >
      저장되었습니다.
    </p>
  ) : null
}

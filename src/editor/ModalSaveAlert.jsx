export function ModalSaveAlert({ visible }) {
  return visible ? (
    <p
      className="bg-[#edf6ef] text-[#245c32]"
      role="status"
    >
      저장되었습니다.
    </p>
  ) : null
}

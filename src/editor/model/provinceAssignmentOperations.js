export function wouldChangeProvinceAssignments(
  provinceAssignments,
  provinces,
  countryId,
) {
  return provinces.some((province) =>
    countryId
      ? provinceAssignments[province.id] !== countryId
      : Boolean(provinceAssignments[province.id]),
  )
}

export function updateProvinceAssignments(editorState, provinces, countryId) {
  if (
    !wouldChangeProvinceAssignments(
      editorState.provinceAssignments,
      provinces,
      countryId,
    )
  ) {
    return editorState
  }

  const nextProvinceAssignments = { ...editorState.provinceAssignments }

  for (const province of provinces) {
    if (countryId) {
      nextProvinceAssignments[province.id] = countryId
    } else {
      delete nextProvinceAssignments[province.id]
    }
  }

  return {
    ...editorState,
    provinceAssignments: nextProvinceAssignments,
  }
}

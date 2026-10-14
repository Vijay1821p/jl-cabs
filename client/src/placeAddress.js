export function componentText(component) {
  return component?.longText || component?.long_name || "";
}

export function componentValue(components, type) {
  return componentText((components || []).find((component) => component.types?.includes(type)));
}

export function districtLabel(name) {
  const text = String(name || "").trim().replace(/\s+district$/i, "");
  if (!text) return "";
  return `${text} District`;
}

export function districtRawFromComponents(components) {
  return componentValue(components, "administrative_area_level_2")
    || componentValue(components, "administrative_area_level_3");
}

export function districtDisplayFromComponents(components) {
  return districtLabel(districtRawFromComponents(components));
}

export function districtFromComponentSets(...componentSets) {
  for (const components of componentSets) {
    const display = districtDisplayFromComponents(components);
    if (display) return display;
  }
  return "";
}

export function parseDistrictFromAddress(address) {
  const text = String(address || "");
  const match = text.match(/,\s*([^,]+?\s+District)\s*(?:,|$)/i);
  return match ? match[1].trim() : "";
}

export function addressWithDistrict(address, components) {
  const district = districtDisplayFromComponents(components);
  const text = String(address || "").trim();
  if (!district) return text;
  if (text.toLowerCase().includes(district.toLowerCase())) return text;
  const state = componentValue(components, "administrative_area_level_1");
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  const country = parts.at(-1)?.toLowerCase() === "india" ? parts.pop() : "";
  const stateIndex = state
    ? parts.findIndex((part) => part.toLowerCase().startsWith(state.toLowerCase()))
    : -1;
  if (stateIndex >= 0) parts.splice(stateIndex, 0, district);
  else parts.push(district);
  if (country) parts.push("India");
  return parts.join(", ");
}

export function finalizeAddress(address, ...componentSets) {
  let text = String(address || "").trim();
  if (!text) return text;
  for (const components of componentSets) {
    if (!components?.length) continue;
    text = addressWithDistrict(text, components);
  }
  return text;
}

export function appendDistrictFromName(address, districtName, stateName = "") {
  const district = districtLabel(districtName);
  const text = String(address || "").trim();
  if (!district || !text || parseDistrictFromAddress(text)) return text;
  if (text.toLowerCase().includes(district.toLowerCase())) return text;
  return addressWithDistrict(text, [
    { types: ["administrative_area_level_2"], longText: district.replace(/\s+District$/i, "") },
    { types: ["administrative_area_level_1"], longText: stateName },
  ]);
}

export function pointWithDistrict(address, lat, lng, ...componentSets) {
  const nextAddress = finalizeAddress(address, ...componentSets);
  const district = districtFromComponentSets(...componentSets) || parseDistrictFromAddress(nextAddress);
  return {
    address: nextAddress,
    lat,
    lng,
    ...(district ? { district } : {}),
  };
}

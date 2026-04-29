export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function td(text) {
  const cell = document.createElement("td");
  cell.textContent = text ?? "-";
  return cell;
}

export function th(text) {
  const cell = document.createElement("th");
  cell.textContent = text;
  return cell;
}

export function option(value, label) {
  const op = document.createElement("option");
  op.value = value;
  op.textContent = label;
  return op;
}

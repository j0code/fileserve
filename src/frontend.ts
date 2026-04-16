const table  = document.querySelector("#dir-index") as HTMLTableElement
const tbody  = table.querySelector("tbody") as HTMLTableSectionElement
// @ts-expect-error Intl.DurationFormat is not yet in @types/node
const format = new Intl.DurationFormat(undefined, {
	style: "narrow",
	years: "long",
	months: "long",
	days: "long",
	yearsDisplay: "auto",
	monthsDisplay: "auto",
	daysDisplay: "auto"
})
const now = Temporal.Now.instant()

for (let row of tbody.rows) {
	if (row.cells.length < 7) continue

	const modifiedDateStr  = row.cells[3]!.textContent ? (row.cells[3]!.textContent + "Z") : ""
	const changedDateStr   = row.cells[4]!.textContent ? (row.cells[4]!.textContent + "Z") : ""
	const accessedDateStr  = row.cells[5]!.textContent ? (row.cells[5]!.textContent + "Z") : ""
	const createdDateStr   = row.cells[6]!.textContent ? (row.cells[6]!.textContent + "Z") : ""

	const modifiedDate  = modifiedDateStr ? Temporal.Instant.from(modifiedDateStr) : ""
	const changedDate   = changedDateStr  ? Temporal.Instant.from(changedDateStr)  : ""
	const accessedDate  = accessedDateStr ? Temporal.Instant.from(accessedDateStr) : ""
	const createdDate   = createdDateStr  ? Temporal.Instant.from(createdDateStr)  : ""
	
	row.cells[3]!.textContent = formatDuration(modifiedDate)
	row.cells[4]!.textContent = formatDuration(changedDate)
	row.cells[5]!.textContent = formatDuration(accessedDate)
	row.cells[6]!.textContent = formatDuration(createdDate)

	if (modifiedDate) row.cells[3]!.title = formatInstant(modifiedDate)
	if (changedDate)  row.cells[4]!.title = formatInstant(changedDate)
	if (accessedDate) row.cells[5]!.title = formatInstant(accessedDate)
	if (createdDate)  row.cells[6]!.title = formatInstant(createdDate)
}

function formatDuration(instant: Temporal.Instant | "") {
	if (!instant) return ""
	if (instant.epochMilliseconds == 0) return "-"

	let duration = now.since(Temporal.Instant.from(instant))

	if (duration.total("seconds") < 1) return "just now"

	duration = duration.round({
		smallestUnit: "second",
		largestUnit: "year",
		relativeTo: now.toZonedDateTimeISO("UTC")
	})

	const unit = smallestUnitFor(duration)

	if (unit == "years" && duration.years > 2) {
		return formatInstant(instant)
	}

	duration = duration.round({
		largestUnit: "auto",
		smallestUnit: unit,
		relativeTo: now.toZonedDateTimeISO("UTC")
	})

	return format.format(duration) + " ago"
}

function smallestUnitFor(duration: Temporal.Duration) {
	const units = ["years", "months", "days", "hours", "minutes", "seconds"] as const
	for (let i of units.keys()) {
		const unit = units[i]!
		if (duration[unit] == 0) continue
		if (i <= units.indexOf("days")) return unit
		return units[i + 1]! || "seconds"
	}
	return "seconds"
}

function formatInstant(instant: Temporal.Instant) {
	return instant.toString({
		timeZone: Temporal.Now.timeZoneId(),
		smallestUnit: "second"
	}).replace("T", " ").substring(0, 19)
}
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AvailabilitySlot, AvailabilityPeriod } from '@/types'

// Sunday and Saturday have both a morning and a night Mass; Monday-Friday only has a night Mass.
const DAYS: { value: number; label: string; hasMorningMass: boolean }[] = [
  { value: 1, label: 'Segunda', hasMorningMass: false },
  { value: 2, label: 'Terça', hasMorningMass: false },
  { value: 3, label: 'Quarta', hasMorningMass: false },
  { value: 4, label: 'Quinta', hasMorningMass: false },
  { value: 5, label: 'Sexta', hasMorningMass: false },
  { value: 6, label: 'Sábado', hasMorningMass: true },
  { value: 0, label: 'Domingo', hasMorningMass: true },
]

interface Props {
  value: AvailabilitySlot[]
  onChange: (slots: AvailabilitySlot[]) => void
}

export function WeeklyAvailabilityPicker({ value, onChange }: Props) {
  const has = (day: number, period: AvailabilityPeriod) =>
    value.some((s) => s.dayOfWeek === day && s.period === period)

  const toggle = (day: number, period: AvailabilityPeriod) => {
    if (has(day, period)) {
      onChange(value.filter((s) => !(s.dayOfWeek === day && s.period === period)))
    } else {
      onChange([...value, { dayOfWeek: day, period }])
    }
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dia</TableHead>
            <TableHead className="text-center">Manhã</TableHead>
            <TableHead className="text-center">Noite</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DAYS.map((day) => (
            <TableRow key={day.value}>
              <TableCell className="font-normal">{day.label}</TableCell>
              <TableCell className="text-center">
                {day.hasMorningMass ? (
                  <Checkbox
                    checked={has(day.value, 'Manha')}
                    onCheckedChange={() => toggle(day.value, 'Manha')}
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Checkbox
                  checked={has(day.value, 'Noite')}
                  onCheckedChange={() => toggle(day.value, 'Noite')}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

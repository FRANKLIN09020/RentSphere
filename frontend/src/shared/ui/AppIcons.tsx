import { SvgIcon, type SvgIconProps } from '@mui/material'

function Icon(props: SvgIconProps & { path: string }) {
  const { path, ...rest } = props
  return (
    <SvgIcon {...rest}>
      <path d={path} />
    </SvgIcon>
  )
}

export const DashboardIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
)

export const ApprovalIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2ZM5 3h14a2 2 0 0 1 2 2v6.1l-2 2V5H5v14h8.1l-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
)

export const ApartmentIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M3 21V3h10v4h8v14h-7v-4h-4v4H3Zm3-3h2v-2H6v2Zm0-4h2v-2H6v2Zm0-4h2V8H6v2Zm0-4h2V4H6v2Zm4 8h2v-2h-2v2Zm0-4h2V8h-2v2Zm0-4h2V4h-2v2Zm4 8h2v-2h-2v2Zm0-4h2V8h-2v2Zm4 8h2v-2h-2v2Zm0-4h2v-2h-2v2Z" />
)

export const LogoutIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M5 21q-.8 0-1.4-.6Q3 19.8 3 19V5q0-.8.6-1.4Q4.2 3 5 3h7v2H5v14h7v2H5Zm11-4-1.4-1.4 2.6-2.6H9v-2h8.2l-2.6-2.6L16 7l5 5-5 5Z" />
)

export const ApiIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M7 7H3v10h4v-2H5V9h2V7Zm10 0v2h2v6h-2v2h4V7h-4Zm-7.2 11 5-12h-2.1l-5 12h2.1Z" />
)

export const LoginIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M10 17v-2h4V9h-4V7h4q.8 0 1.4.6.6.6.6 1.4v6q0 .8-.6 1.4-.6.6-1.4.6h-4Zm1-3-1.4-1.4L11.2 11H3V9h8.2L9.6 7.4 11 6l4 4-4 4Zm7 7H6q-.8 0-1.4-.6Q4 19.8 4 19v-3h2v3h12V5H6v3H4V5q0-.8.6-1.4Q5.2 3 6 3h12q.8 0 1.4.6.6.6.6 1.4v14q0 .8-.6 1.4-.6.6-1.4.6Z" />
)

export const AddIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M11 19v-6H5v-2h6V5h2v6h6v2h-6v6h-2Z" />
)

export const MenuIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M3 18v-2h18v2H3Zm0-5v-2h18v2H3Zm0-5V6h18v2H3Z" />
)

export const EditIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M5 19h1.4L16.7 8.7l-1.4-1.4L5 17.6V19Zm-2 2v-4.2L16.7 3.1q.3-.3.7-.4.4-.1.8-.1t.8.1q.4.1.7.4l1.2 1.2q.3.3.4.7.1.4.1.8t-.1.8q-.1.4-.4.7L7.2 21H3Z" />
)

export const DeleteIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M7 21q-.8 0-1.4-.6Q5 19.8 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .8-.6 1.4-.6.6-1.4.6H7Zm2-4h2V8H9v9Zm4 0h2V8h-2v9Z" />
)

export const RefreshIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12 20q-3.35 0-5.675-2.325Q4 15.35 4 12t2.325-5.675Q8.65 4 12 4q1.725 0 3.3.713Q16.875 5.425 18 6.7V4h2v7h-7V9h3.2q-.8-1.4-1.9-2.2Q13.2 6 12 6 9.5 6 7.75 7.75T6 12q0 2.5 1.75 4.25T12 18q1.925 0 3.475-1.1Q17.025 15.8 17.65 14h2.1q-.7 2.65-2.85 4.325Q14.75 20 12 20Z" />
)

export const SaveIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M5 21q-.8 0-1.4-.6Q3 19.8 3 19V5q0-.8.6-1.4Q4.2 3 5 3h11l5 5v11q0 .8-.6 1.4-.6.6-1.4.6H5Zm7-3q1.25 0 2.125-.875T15 15q0-1.25-.875-2.125T12 12q-1.25 0-2.125.875T9 15q0 1.25.875 2.125T12 18ZM6 9h9V5H6v4Z" />
)

export const SearchIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M9.5 16q-2.725 0-4.612-1.888Q3 12.225 3 9.5t1.888-4.612Q6.775 3 9.5 3t4.613 1.888Q16 6.775 16 9.5q0 1.075-.338 2.063-.337.987-.912 1.762l5.025 5.025-1.425 1.425-5-5q-.775.575-1.775.9-1 .325-2.075.325Zm0-2q1.875 0 3.188-1.312Q14 11.375 14 9.5t-1.312-3.188Q11.375 5 9.5 5T6.312 6.312Q5 7.625 5 9.5t1.312 3.188Q7.625 14 9.5 14Z" />
)

export const ImageIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M5 21q-.825 0-1.412-.587Q3 19.825 3 19V5q0-.825.588-1.412Q4.175 3 5 3h14q.825 0 1.413.588Q21 4.175 21 5v14q0 .825-.587 1.413Q19.825 21 19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Zm0-10.5q0 .625.438 1.063Q6.875 8 7.5 8t1.063-.437Q9 7.125 9 6.5t-.437-1.062Q8.125 5 7.5 5t-1.062.438Q6 5.875 6 6.5Z" />
)

export const LocationIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12 22q-3.025-2.575-4.512-4.787Q6 15 6 12.6q0-2.75 1.763-4.675Q9.525 6 12 6t4.238 1.925Q18 9.85 18 12.6q0 2.4-1.487 4.613Q15.025 19.425 12 22Zm0-7q1.05 0 1.775-.725.725-.725.725-1.775t-.725-1.775Q13.05 10 12 10t-1.775.725Q9.5 11.45 9.5 12.5t.725 1.775Q10.95 15 12 15ZM5 5V3h14v2H5Z" />
)

export const MoneyIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12 21q-3.75 0-6.375-2.625T3 12q0-3.75 2.625-6.375T12 3q3.75 0 6.375 2.625T21 12q0 3.75-2.625 6.375T12 21Zm-1-4h2v-1.1q1.05-.2 1.775-.862.725-.663.725-1.738 0-.95-.55-1.575-.55-.625-2.05-1.175-1.275-.475-1.637-.762-.363-.288-.363-.738 0-.5.35-.775Q11.6 8 12.25 8q.625 0 1.025.3.4.3.625.85l1.65-.7q-.325-.875-.95-1.35-.625-.475-1.6-.625V5h-2v1.45q-.95.2-1.525.85Q8.9 7.95 8.9 8.95q0 1.075.7 1.688.7.612 2.1 1.087 1.2.425 1.5.75.3.325.3.825 0 .575-.425.888-.425.312-1.125.312-.725 0-1.25-.4-.525-.4-.775-1.15l-1.75.7q.4 1.075 1.125 1.65.725.575 1.7.725V17Z" />
)

export const PeopleIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M16 11q1.25 0 2.125-.875T19 8q0-1.25-.875-2.125T16 5q-1.25 0-2.125.875T13 8q0 1.25.875 2.125T16 11Zm-8 0q1.25 0 2.125-.875T11 8q0-1.25-.875-2.125T8 5q-1.25 0-2.125.875T5 8q0 1.25.875 2.125T8 11Zm0 2q-2.125 0-3.562 1.025Q3 15.05 3 16.5V19h10v-2.5q0-1.45-1.438-2.475Q10.125 13 8 13Zm8 0q-.45 0-.875.05.825.6 1.35 1.475Q17 15.4 17 16.5V19h4v-2.5q0-1.45-1.438-2.475Q18.125 13 16 13Z" />
)

export const CheckIcon = (props: SvgIconProps) => (
  <Icon {...props} path="m9 16.2-4.2-4.2-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" />
)

export const CancelIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12 2q2.075 0 3.9.788 1.825.787 3.175 2.137 1.35 1.35 2.138 3.175Q22 9.925 22 12t-.787 3.9q-.788 1.825-2.138 3.175-1.35 1.35-3.175 2.138Q14.075 22 12 22t-3.9-.787q-1.825-.788-3.175-2.138-1.35-1.35-2.137-3.175Q2 14.075 2 12t.788-3.9q.787-1.825 2.137-3.175 1.35-1.35 3.175-2.137Q9.925 2 12 2Zm-3.5 13.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4-2.1-2.1 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1Z" />
)

export const WarningIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M1 21 12 2l11 19H1Zm12-3v-2h-2v2h2Zm0-4v-4h-2v4h2Z" />
)

export const OrganizationIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M4 21V5q0-.825.588-1.412Q5.175 3 6 3h8q.825 0 1.413.588Q16 4.175 16 5v3h2q.825 0 1.413.588Q20 9.175 20 10v11h-7v-4H9v4H4Zm3-12h2V7H7v2Zm0 4h2v-2H7v2Zm4-4h2V7h-2v2Zm0 4h2v-2h-2v2Zm5 0h2v-2h-2v2Zm0 4h2v-2h-2v2Z" />
)

export const BuildingIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M3 21V7l9-4 9 4v14h-6v-6H9v6H3Zm4-10h2V9H7v2Zm0 4h2v-2H7v2Zm4-4h2V9h-2v2Zm0 4h2v-2h-2v2Zm4-4h2V9h-2v2Zm0 4h2v-2h-2v2Z" />
)

export const UnitIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M4 21V3h16v18H4Zm3-3h4v-4H7v4Zm6 0h4v-4h-4v4ZM7 12h4V8H7v4Zm6 0h4V8h-4v4Z" />
)

export const AgreementIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M6 22q-.825 0-1.412-.587Q4 20.825 4 20V4q0-.825.588-1.412Q5.175 2 6 2h8l6 6v12q0 .825-.587 1.413Q18.825 22 18 22H6Zm7-13V4H6v16h12V9h-5Zm-5 8h8v-2H8v2Zm0-4h8v-2H8v2Z" />
)

export const InvoiceIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M6 22q-.825 0-1.412-.587Q4 20.825 4 20V2l1.5 1.5L7 2l1.5 1.5L10 2l1.5 1.5L13 2l1.5 1.5L16 2l1.5 1.5L19 2v18q0 .825-.587 1.413Q17.825 22 17 22H6Zm2-5h8v-2H8v2Zm0-4h8v-2H8v2Zm0-4h8V7H8v2Z" />
)

export const ComplaintIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M4 20V4q0-.825.588-1.412Q5.175 2 6 2h12q.825 0 1.413.588Q20 3.175 20 4v9q0 .825-.587 1.413Q18.825 15 18 15H8l-4 5Zm7-8h2v-2h-2v2Zm0-4h2V5h-2v3Z" />
)

export const ShieldIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12 22q-3.475-.875-5.738-3.988Q4 14.9 4 11V5l8-3 8 3v6q0 3.9-2.263 7.013Q15.475 21.125 12 22Zm-1-7 6-6-1.4-1.4L11 12.2 8.9 10.1 7.5 11.5 11 15Z" />
)

export const SendIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M3 20v-6l8-2-8-2V4l19 8-19 8Z" />
)

export const CloseIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19Z" />
)

export const UploadIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M11 16V7.85L8.4 10.45 7 9l5-5 5 5-1.4 1.45-2.6-2.6V16h-2Zm-5 4q-.825 0-1.412-.587Q4 18.825 4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413Q18.825 20 18 20H6Z" />
)

export const DownloadIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12 16 7 11l1.4-1.4 2.6 2.6V3h2v9.2l2.6-2.6L17 11l-5 5ZM5 21q-.8 0-1.4-.6Q3 19.8 3 19v-4h2v4h14v-4h2v4q0 .8-.6 1.4-.6.6-1.4.6H5Z" />
)

export const HelpIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12 22q-2.05 0-3.875-.788-1.825-.787-3.187-2.15-1.363-1.362-2.15-3.187Q2 14.05 2 12q0-2.075.788-3.887.787-1.813 2.15-3.175Q6.3 3.575 8.125 2.787 9.95 2 12 2q2.075 0 3.887.787 1.813.788 3.176 2.151 1.362 1.362 2.15 3.175Q22 9.925 22 12t-.787 3.888q-.788 1.812-2.15 3.175-1.363 1.363-3.176 2.15Q14.075 22 12 22Zm-1-5h2v-2h-2v2Zm2.3-4.35q.95-.9 1.475-1.55T15.3 10q0-1.625-1.075-2.612Q13.15 6.4 11.575 6.4q-1.275 0-2.262.612-1.013.613-1.613 1.688l1.8 1.075q.45-.7 1-.988.55-.287 1.05-.287.7 0 1.2.35.5.35.5 1.05 0 .5-.413.988-.412.487-1.212 1.212-.775.725-1.425 1.625-.65.9-.65 1.95H12q0-.825.375-1.475.375-.65 1.25-1.3Z" />
)

export const ProfileIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12 12q-1.65 0-2.825-1.175Q8 9.65 8 8t1.175-2.825Q10.35 4 12 4t2.825 1.175Q16 6.35 16 8t-1.175 2.825Q13.65 12 12 12Zm-7 9v-2q0-1.25.638-2.288.637-1.037 1.737-1.587 1.112-.55 2.325-.838Q10.912 14 12 14t2.3.287q1.213.288 2.325.838 1.1.55 1.737 1.587Q19 17.75 19 19v2H5Z" />
)

export const KeyIcon = (props: SvgIconProps) => (
  <Icon {...props} path="M12.65 10a5.99 5.99 0 0 0-6.88-3.88c-2.29.46-4.15 2.29-4.63 4.58A6 6 0 0 0 7 17a5.99 5.99 0 0 0 6-4h3v3h3v-3h3v-3h-9.35ZM7 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
)

import * as React from "react";
const SmartSalesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={100}
    height={100}
    {...props}
  >
    <rect width={100} height={100} fill="transparent" />
    <rect x={0} y={0} width={62} height={25} fill="#6cbaea" rx={5} />
    <rect x={0} y={0} width={25} height={60} fill="#6cbaea" rx={5} />
    <rect x={37} y={37} width={25} height={63} fill="#006ebb" rx={5} />
    <rect x={0} y={70} width={25} height={30} fill="#24aee4" rx={5} />
    <rect x={75} y={0} width={25} height={100} fill="#004883" rx={5} />
  </svg>
);
export default SmartSalesIcon;

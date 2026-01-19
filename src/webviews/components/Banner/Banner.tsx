import "./Banner.scss";

type BannerProps = {
  type: "info" | "warning" | "error" | "success";
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export function Banner(props: BannerProps) {
  return (
    <div
      banner-type={props.type}
      style={props.style}
      className={`bannerContainer ${props.className}`}
    >
      {props.children}
    </div>
  );
}

export default function LoadingMessage({ children = "Loading..." }) {
  return <p className="feedback-message" role="status">{children}</p>;
}

import { useRef, useState } from "react";

/**
 * Press feedback that fires on pointer-DOWN, not on click.
 *
 * Waiting for the click event before showing a response is the most common way
 * a web UI ends up feeling dead next to a native one. The scale also releases
 * if the finger slides away, so a press can be cancelled the way it can on iOS.
 *
 * `activeStyle` is still honoured for callers that want more than a scale.
 */
export default function Pressable({
  as: Tag = "div",
  style,
  hoverStyle,
  activeStyle,
  pressScale = 0.97,
  disabled,
  children,
  onClick,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const originRef = useRef(null);

  const release = () => {
    setPressed(false);
    originRef.current = null;
  };

  const merged = {
    ...style,
    ...(hover && !disabled ? hoverStyle : null),
    ...(pressed ? activeStyle : null),
  };

  // A caller-supplied active transform wins; otherwise apply the scale.
  const hasCustomTransform = pressed && activeStyle?.transform;
  if (!hasCustomTransform) {
    merged.transform = `${style?.transform ? `${style.transform} ` : ""}scale(${
      pressed ? pressScale : 1
    })`;
  }

  // Fast in, slower out — pressing should feel immediate, releasing relaxed.
  merged.transition = `transform ${pressed ? 90 : 260}ms cubic-bezier(.23,1,.32,1)${
    style?.transition ? `, ${style.transition}` : ""
  }`;
  merged.touchAction = "manipulation";
  merged.WebkitTapHighlightColor = "transparent";

  return (
    <Tag
      style={merged}
      onPointerDown={(e) => {
        if (disabled) return;
        originRef.current = { x: e.clientX, y: e.clientY };
        setPressed(true);
      }}
      onPointerMove={(e) => {
        // ~10px of slop, then the press is treated as a drag and cancelled.
        if (!originRef.current) return;
        const dx = e.clientX - originRef.current.x;
        const dy = e.clientY - originRef.current.y;
        if (Math.hypot(dx, dy) > 10) release();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={() => {
        setHover(false);
        release();
      }}
      onPointerEnter={() => setHover(true)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </Tag>
  );
}

import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const GOLD = "#e6b04c";
const GOLD_LIGHT = "#f2c166";
const BLACK = "#0a0a0a";
const SURFACE = "#151515";
const BORDER = "#29292b";
const WHITE = "#f5f5f5";
const MUTED = "#b2b2bb";
const GREEN = "#4ade80";
const FONT = 'Geist, "Segoe UI", Arial, sans-serif';
const MONO = 'Geist Mono, Consolas, "Courier New", monospace';

export const MyComposition = () => (
  <Composition
    id="FinSightPromo"
    component={FinSightPromo}
    durationInFrames={24 * 30}
    fps={30}
    width={1920}
    height={1080}
  />
);

const FinSightPromo = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: BLACK, color: WHITE, fontFamily: FONT }}>
      <Sequence from={0} durationInFrames={5 * fps}>
        <IntroScene />
      </Sequence>
      <Sequence from={5 * fps} durationInFrames={6.5 * fps}>
        <OverviewScene />
      </Sequence>
      <Sequence from={11.5 * fps} durationInFrames={6 * fps}>
        <SourceScene />
      </Sequence>
      <Sequence from={17.5 * fps} durationInFrames={6.5 * fps}>
        <ValuesScene />
      </Sequence>
      <AbsoluteFill
        style={{
          backgroundColor: BLACK,
          pointerEvents: "none",
          opacity: interpolate(
            frame,
            [144, 150, 156, 339, 345, 351, 519, 525, 531],
            [0, 0.82, 0, 0, 0.82, 0, 0, 0.82, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      />
    </AbsoluteFill>
  );
};

const Backdrop = () => (
  <AbsoluteFill style={{ backgroundColor: BLACK }}>
    <AbsoluteFill
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 78% at 18% 8%, rgba(230,176,76,0.09), transparent 72%)",
      }}
    />
    <AbsoluteFill
      style={{
        opacity: 0.22,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse 80% 88% at 50% 30%, #000 20%, transparent 100%)",
      }}
    />
  </AbsoluteFill>
);

const Wordmark = ({ subtle = false }: { subtle?: boolean }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      color: WHITE,
      fontSize: 29,
      fontWeight: 650,
      letterSpacing: "-0.04em",
      opacity: subtle ? 0.82 : 1,
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 8,
        backgroundColor: GOLD,
        color: BLACK,
        display: "grid",
        placeItems: "center",
        fontSize: 25,
        fontWeight: 800,
        letterSpacing: "-0.04em",
      }}
    >
      F
    </div>
    <span>FinSight</span>
    <span
      style={{
        marginLeft: 2,
        color: "#777780",
        fontFamily: MONO,
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: "0.02em",
      }}
    >
      v0.4.0
    </span>
  </div>
);

const Eyebrow = ({ children }: { children: string }) => (
  <div
    style={{
      color: GOLD_LIGHT,
      fontFamily: MONO,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const IntroScene = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 144, top: 92 }}>
        <Wordmark />
      </div>
      <svg
        width="780"
        height="490"
        viewBox="0 0 780 490"
        style={{ position: "absolute", right: -24, top: 274, opacity: 0.25 }}
        aria-hidden
      >
        <path
          d="M12 404 C104 386 120 304 210 320 S334 354 402 256 S502 245 555 185 S659 174 768 52"
          fill="none"
          stroke={GOLD}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M12 432 H768" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <path d="M12 330 H768" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <path d="M12 228 H768" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <circle cx="555" cy="185" r="7" fill={GOLD_LIGHT} />
        <circle cx="768" cy="52" r="8" fill={GOLD_LIGHT} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 245,
          width: 1520,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate:
            "0 " +
            interpolate(frame, [0, 22], [42, 0], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) +
            "px",
        }}
      >
        <Eyebrow>Open-source finance research</Eyebrow>
        <h1
          style={{
            margin: "32px 0 0",
            maxWidth: 1480,
            color: WHITE,
            fontSize: 102,
            lineHeight: 1.04,
            letterSpacing: "-0.065em",
            fontWeight: 650,
          }}
        >
          The open-source
          <br />
          <span style={{ color: GOLD }}>finance research terminal.</span>
        </h1>
        <p
          style={{
            margin: "38px 0 0",
            maxWidth: 1240,
            color: MUTED,
            fontSize: 36,
            lineHeight: 1.45,
            letterSpacing: "-0.025em",
          }}
        >
          Market and news evidence. Company context. Clear source labels.
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          bottom: 88,
          width: 1600,
          height: 2,
          backgroundColor: BORDER,
        }}
      >
        <div
          style={{
            width:
              interpolate(frame, [10, 60], [0, 100], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }) + "%",
            height: "100%",
            backgroundColor: GOLD,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const BrowserFrame = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      width: 1520,
      overflow: "hidden",
      border: "1px solid " + BORDER,
      borderRadius: 16,
      backgroundColor: "#111111",
      boxShadow: "0 32px 100px rgba(0,0,0,0.55)",
    }}
  >
    <div
      style={{
        height: 38,
        padding: "0 18px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderBottom: "1px solid " + BORDER,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 99, background: "#333333" }} />
      <span style={{ width: 9, height: 9, borderRadius: 99, background: "#333333" }} />
      <span style={{ width: 9, height: 9, borderRadius: 99, background: GOLD, opacity: 0.72 }} />
      <span
        style={{
          marginLeft: 12,
          color: "#777780",
          fontFamily: MONO,
          fontSize: 13,
          letterSpacing: "0.035em",
        }}
      >
        finsight — market overview
      </span>
    </div>
    {children}
  </div>
);

const OverviewScene = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", top: 72, left: 200 }}>
        <Wordmark subtle />
      </div>
      <div style={{ position: "absolute", top: 132, left: 200 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 58,
            lineHeight: 1.08,
            letterSpacing: "-0.055em",
            fontWeight: 620,
          }}
        >
          Research in one clear view.
        </h2>
        <p style={{ margin: "14px 0 0", color: MUTED, fontSize: 28 }}>
          Markets, company context and headlines—together.
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          top: 256,
          left: 200,
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate:
            "0 " +
            interpolate(frame, [0, 24], [34, 0], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) +
            "px",
          scale: interpolate(frame, [0, 24], [0.985, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <BrowserFrame>
          <Img
            src={staticFile("overview-dashboard.png")}
            style={{
              display: "block",
              width: 1520,
              height: 680,
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

const SourceScene = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 160, top: 92 }}>
        <Wordmark subtle />
      </div>
      <div style={{ position: "absolute", left: 160, top: 250, width: 790 }}>
        <Eyebrow>Transparent by design</Eyebrow>
        <h2
          style={{
            margin: "28px 0 0",
            fontSize: 76,
            lineHeight: 1.05,
            letterSpacing: "-0.06em",
            fontWeight: 640,
          }}
        >
          Inspect where each data point comes from.
        </h2>
        <p
          style={{
            margin: "34px 0 0",
            maxWidth: 740,
            color: MUTED,
            fontSize: 32,
            lineHeight: 1.5,
            letterSpacing: "-0.02em",
          }}
        >
          Live provider results are identified. Demo data stays clearly labeled.
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1020,
          top: 240,
          width: 720,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate:
            "0 " +
            interpolate(frame, [0, 26], [36, 0], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) +
            "px",
        }}
      >
        <SourceCard
          label="DEMO / FALLBACK"
          badge="MOCK DATA"
          badgeColor={GOLD}
          description="Clearly marked when live data is unavailable."
        />
        <div style={{ height: 18 }} />
        <SourceCard
          label="LIVE PROVIDER · WHEN CONFIGURED"
          badge="Finnhub"
          badgeColor={GREEN}
          description="Bring your own keys for supported live market data."
        />
        <div
          style={{
            marginTop: 24,
            height: 1,
            width:
              interpolate(frame, [24, 62], [0, 720], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }) + "px",
            backgroundColor: BORDER,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const SourceCard = ({
  label,
  badge,
  badgeColor,
  description,
}: {
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
}) => (
  <div
    style={{
      padding: "27px 30px 28px",
      border: "1px solid " + badgeColor + "55",
      borderRadius: 12,
      background:
        badgeColor === GOLD
          ? "linear-gradient(135deg, #191713, #101010)"
          : "linear-gradient(135deg, #131915, #101010)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
      }}
    >
      <span
        style={{
          color: "#8b8b95",
          fontFamily: MONO,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          padding: "8px 12px",
          border: "1px solid " + badgeColor + "55",
          borderRadius: 6,
          color: badgeColor,
          backgroundColor: badgeColor === GOLD ? "#291f10" : "#102217",
          fontFamily: MONO,
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.03em",
          whiteSpace: "nowrap",
        }}
      >
        {badge}
      </span>
    </div>
    <p
      style={{
        margin: "23px 0 0",
        color: WHITE,
        fontSize: 24,
        lineHeight: 1.4,
        letterSpacing: "-0.02em",
      }}
    >
      {description}
    </p>
  </div>
);

const ValuesScene = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 160, top: 120 }}>
        <Wordmark />
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 268,
          opacity: interpolate(frame, [0, 22], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate:
            "0 " +
            interpolate(frame, [0, 26], [42, 0], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) +
            "px",
        }}
      >
        <Eyebrow>Finance research, on your terms</Eyebrow>
        <h2
          style={{
            margin: "34px 0 0",
            fontSize: 104,
            lineHeight: 1.03,
            letterSpacing: "-0.065em",
            fontWeight: 650,
          }}
        >
          Your keys.
          <br />
          Your machine.
          <br />
          <span style={{ color: GOLD }}>Your data.</span>
        </h2>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1125,
          top: 374,
          width: 600,
          display: "flex",
          flexDirection: "column",
          gap: 15,
          opacity: interpolate(frame, [12, 34], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {["OPEN SOURCE", "LOCAL-FIRST", "BRING YOUR OWN KEYS"].map((value, index) => (
          <div
            key={value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "19px 22px",
              border: "1px solid " + BORDER,
              borderRadius: 9,
              backgroundColor: SURFACE,
              color: WHITE,
              fontFamily: MONO,
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "0.05em",
              translate:
                "0 " +
                interpolate(frame, [14 + index * 7, 32 + index * 7], [20, 0], {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }) +
                "px",
            }}
          >
            <span style={{ color: GOLD, fontSize: 22 }}>↗</span>
            {value}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          bottom: 86,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            padding: "18px 25px",
            borderRadius: 8,
            backgroundColor: GOLD,
            color: BLACK,
            fontSize: 23,
            fontWeight: 650,
            letterSpacing: "-0.02em",
          }}
        >
          Explore FinSight <span style={{ marginLeft: 14 }}>↗</span>
        </div>
        <span
          style={{
            color: MUTED,
            fontFamily: MONO,
            fontSize: 18,
            letterSpacing: "0.015em",
          }}
        >
          finsight-psi-gold.vercel.app
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          right: 160,
          bottom: 98,
          color: "#777780",
          fontFamily: MONO,
          fontSize: 16,
          letterSpacing: "0.025em",
        }}
      >
        github.com/ks2483735-afk/finsight
      </div>
    </AbsoluteFill>
  );
};

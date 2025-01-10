export interface PopupButton {
  label: { english: string; german: string };
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface PopupProps {
  show: boolean;
  title: { english: string; german: string } | null;
  description: { english: string; german: string } | null;
  buttons?: PopupButton[];
}

export function Popup({ title, description, show, buttons = [] }: PopupProps) {
  if (!show || !title || !description) {
    return null;
  }

  const buttonsToRender = buttons.length > 0 ? buttons : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
      style={{
        marginTop: 0,
      }}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">{title.german}</h1>
            <h2 className="text-xl text-gray-600 italic">{title.english}</h2>
          </div>

          <div className="space-y-2">
            <p className="text-gray-800">{description.german}</p>
            <p className="text-gray-600 italic">{description.english}</p>
          </div>

          <div className="pt-4 flex gap-3">
            {buttonsToRender.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 ${
                  button.variant === "secondary"
                    ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                <span className="block">{button.label.german}</span>
                <span className="block text-sm opacity-75 italic">
                  {button.label.english}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

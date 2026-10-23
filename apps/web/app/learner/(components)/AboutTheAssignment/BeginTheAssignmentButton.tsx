import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/strings";
import { useLearnerStore } from "@/stores/learner";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Button from "../../../../components/Button";

interface Props extends React.ComponentPropsWithoutRef<"div"> {
  disabled: boolean;
  message: React.ReactNode;
  label: string;
  href: string;
  className?: string;
  /** "onHero" inverts the button so it stays legible on the gradient band. */
  tone?: "primary" | "onHero";
  onBegin?: () => void | Promise<void>;
}

const BeginTheAssignment: React.FC<Props> = (props) => {
  const { disabled, message, label, href, className, tone, onBegin } = props;
  const userPreferedLanguage = useLearnerStore(
    (state) => state.userPreferedLanguage,
  );
  const setUserPreferedLanguage = useLearnerStore(
    (state) => state.setUserPreferedLanguage,
  );
  const MoveToQuestionPage = async () => {
    if (!disabled) {
      setUserPreferedLanguage(userPreferedLanguage);
      if (onBegin) {
        await onBegin();
        return;
      }
      window.location.href = href;
    }
  };

  return (
    <div className={cn(className, "w-full lg:w-auto")}>
      <Tooltip distance={3} content={message}>
        <Button
          className={cn(
            "group flex w-full items-center justify-center gap-x-2 text-center sm:w-auto disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none",
            tone === "onHero" ? "btn-on-hero" : "btn-primary",
          )}
          disabled={disabled}
          onClick={MoveToQuestionPage}
        >
          {label}
          <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Button>
      </Tooltip>
    </div>
  );
};

export default BeginTheAssignment;

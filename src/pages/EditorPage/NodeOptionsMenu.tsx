import {useRef, useState} from "react";
import {useClickOutside} from "../../utils/use-click-outside";
import {useOnKey} from "../../utils/use-on-key";
import {SkillChipsInput} from "../../components/SkillChipsInput";

export function NodeOptionsMenu(
    {
        isHardStopEnabled,
        isSkillsEnabled,
        requiredSkills,
        skillsForPicker,
        onToggleHardStop,
        onToggleSkills,
        onChangeSkills,
        onDeleteNode,
    }: {
        isHardStopEnabled: boolean
        isSkillsEnabled: boolean
        requiredSkills: string[]
        skillsForPicker: string[]
        onToggleHardStop: () => void
        onToggleSkills: () => void
        onChangeSkills: (skills: string[]) => void
        onDeleteNode: () => void
    }
) {
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement | null>(null)

    const close = () => setIsOpen(false)

    useClickOutside(rootRef, isOpen, close)
    useOnKey('Escape', isOpen, close)

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="list-none cursor-pointer select-none text-xs text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-100"
            >
                ...
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-10 min-w-[190px] p-1">
                    <button
                        type="button"
                        onClick={() => {
                            onToggleHardStop()
                            close()
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 border-b"
                    >
                        {isHardStopEnabled ? 'Disable hard stop' : 'Enable hard stop'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onToggleSkills()
                            if (isSkillsEnabled) close()
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 border-b"
                    >
                        {isSkillsEnabled ? 'Disable required skills' : 'Add required skill'}
                    </button>

                    {isSkillsEnabled && (
                        <div className="px-2 py-1.5 border-b">
                            <SkillChipsInput
                                value={requiredSkills}
                                suggestions={skillsForPicker}
                                onChange={onChangeSkills}
                                placeholder="Required skill..."
                                inputClassName="text-[10px]"
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            close()
                            onDeleteNode()
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                        Delete node
                    </button>
                </div>
            )}
        </div>
    )
}
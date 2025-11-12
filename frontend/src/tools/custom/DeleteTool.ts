import { ToolBase } from '../Tool';
import { TrashIcon } from '@radix-ui/react-icons';
import type ToolSystem from '../ToolSystem';

/**
 * DeleteTool — one-click action to delete selected annotations.
 * Not a persistent tool.
 */
class DeleteTool extends ToolBase {
    constructor(toolSystem: ToolSystem) {
        super(toolSystem, "Delete", TrashIcon, "Delete");
    }

    /**
     * Executes deletion immediately — doesn't persist as active tool.
     */
    execute() {
        const selectedIDs = this.toolSystem.selectedAnnotationIDs;
        if (!selectedIDs || selectedIDs.length === 0) return;

        selectedIDs.forEach(id => {
            this.toolSystem.removeAnnotation(id);
        });

        // Clear selection after deletion
        this.toolSystem.setSelectedAnnotationIDs([]);
    }
}

export default DeleteTool;

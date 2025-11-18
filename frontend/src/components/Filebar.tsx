import React, { useRef, useState } from 'react';
//import { Menubar, Dialog } from 'radix-ui';
import * as Menubar from '@radix-ui/react-menubar';
import * as Dialog from '@radix-ui/react-dialog';
import {
	CheckIcon,
	ChevronRightIcon,
	Cross2Icon,
	DotFilledIcon,
	GlobeIcon
} from '@radix-ui/react-icons';
import './styles.css';
import { ConfigManager } from '../tools/config_manager';
import type ToolSystem from '../tools/ToolSystem';
import i18n from '../tools/i18n';
import { useTranslation } from "react-i18next";

const CHECK_ITEMS = ['Always Show Bookmarks Bar', 'Always Show Full URLs'];

interface FilebarProps {
	setImageFiles: (images: FileList) => void;
	configManager: ConfigManager | null;
	toolSystem: ToolSystem | null;
	currentAnnotationClass: string;
	availableModels: Record<string, string>;
	selectedModels: string[];
	onModelSelect: (modelNames: string[]) => void;
	onCustomModelUpload: (file: File) => void;
	onPreprocess: () => void;
	onExportAll: () => void;
	onExportCurrent: () => void;
}

/**
 * Filebar component; displays filebar and handles system interaction beyond basic tools.
 */
const Filebar: React.FC<FilebarProps> = ({
	setImageFiles,
	configManager,
	toolSystem,
	currentAnnotationClass,
	availableModels,
	selectedModels,
	onModelSelect,
	onCustomModelUpload,
	onPreprocess,
	onExportAll,
	onExportCurrent,
}) => {

	//language
	const { t } = useTranslation("filebar");

	const [checkedSelection, setCheckedSelection] = useState([
		CHECK_ITEMS[1],
	]);

	const [isClassesDialogOpen, setIsClassesDialogOpen] = useState(false);
	const [classItems, setClassItems] = useState<Array<{ id: string, name: string, color: string }>>([]);

	/**
	 * Select a ONNX model from the list of models,
	 * @param model Name of ONNX model (stored in App.tsx/availableModels)
	 */
	const handleModelCheckboxChange = (model: string) => {
		if (selectedModels.includes(model)) {
			onModelSelect(selectedModels.filter(m => m !== model));
		}
		else {
			onModelSelect([...selectedModels, model]);
		}
	};

	// Update local state when config manager changes
	React.useEffect(() => {
		if (configManager) {
			const configClasses = configManager.getClassNames();
			const items = Object.entries(configClasses).map(([name, color], index) => ({
				id: `class-${index}-${Date.now()}`,
				name,
				color
			}));
			setClassItems(items);
		}
	}, [configManager]);

	/**
	 * Save Config/class values.
	 */
	const handleSaveClasses = () => {
		if (configManager) {
			// Convert back to config format
			const configFormat: { [key: string]: string } = {};
			classItems.forEach(item => {
				if (item.name.trim()) { // Only save non-empty names
					configFormat[item.name] = item.color;
				}
			});

			configManager.setClassNames(configFormat);
			configManager.saveToStorage();
		}

		setIsClassesDialogOpen(false);
	};

	const handleCancelClasses = () => {
		if (configManager) {
			// Reset to saved config
			const configClasses = configManager.getClassNames();
			const items = Object.entries(configClasses).map(([name, color], index) => ({
				id: `class-${index}-${Date.now()}`,
				name,
				color
			}));
			setClassItems(items);
		}
		setIsClassesDialogOpen(false);
	};

	const updateClassName = (id: string, newName: string) => {
		setClassItems(items => items.map(item =>
			item.id === id ? { ...item, name: newName } : item
		));
	};

	const updateClassColor = (id: string, newColor: string) => {
		setClassItems(items => items.map(item =>
			item.id === id ? { ...item, color: newColor } : item
		));
	};

	const deleteClass = (id: string) => {
		setClassItems(items => items.filter(item => item.id !== id));
	};

	const addClass = () => {
		setClassItems(items => [...items, {
			id: `class-new-${Date.now()}`,
			name: 'New Class',
			color: '#FF0000'
		}]);
	};
	React.useEffect(() => {
	if (Object.keys(availableModels).length > 0 && selectedModels.length === 0) {
		const firstModel = Object.keys(availableModels)[0];
		onModelSelect([firstModel]);
	}
}, [availableModels]);

	return (
		<Menubar.Root className='MenubarRoot flex w-full items-center'>
			
			{/** FILE */}
			<Menubar.Menu>
				<Menubar.Trigger className='MenubarTrigger'>{t("file")}</Menubar.Trigger>
				<Menubar.Portal>
					<Menubar.Content
						className='MenubarContent'
						align='start'
						sideOffset={5}
						alignOffset={-3}
					>
						<Menubar.Item className='MenubarItem'
							onClick={() => {
								const fileInput = document.getElementById('imageInput') as HTMLInputElement;
								if (fileInput) {
									fileInput.click(); // Programmatically trigger the file input
								}
							}}
						>
							{t("open")} <div className='RightSlot'>CTRL + O</div>
						</Menubar.Item>
						{/* New: Open folder (select directory) */}
						<Menubar.Item className='MenubarItem'
							onClick={() => {
								const fileInput = document.getElementById('imageInput') as HTMLInputElement;
								if (fileInput) {
									// Enable directory selection (works in Chromium/WebKit). Use setAttribute to avoid TS props errors.
									fileInput.setAttribute('webkitdirectory', '');
									fileInput.setAttribute('directory', '');
									fileInput.click();
									// clear attributes after click so normal file dialog still works later
									setTimeout(() => {
										fileInput.removeAttribute('webkitdirectory');
										fileInput.removeAttribute('directory');
									}, 200);
								}
							}}
						>
							Open Folder
						</Menubar.Item>
						<Menubar.Separator className='MenubarSeparator' />
						<Menubar.Item className='MenubarItem'
						>
							Clear All Files
						</Menubar.Item>
						<Menubar.Separator className='MenubarSeparator' />
						<Menubar.Separator className='MenubarSeparator' />
						<Menubar.Sub>
							<Menubar.SubTrigger className='MenubarSubTrigger'>
								{t("export")}
								<div className='RightSlot'>
									<ChevronRightIcon />
								</div>
							</Menubar.SubTrigger>
							<Menubar.Portal>
								<Menubar.SubContent
									className='MenubarSubContent'
									alignOffset={-5}
								>
									<Menubar.Item className='MenubarItem'
										onClick={onExportAll}
									>
										{t("exportAll")}
									</Menubar.Item>
									<Menubar.Item className='MenubarItem'
										onClick={onExportCurrent}
									>
										{t("exportCurr")}
									</Menubar.Item>
								</Menubar.SubContent>
							</Menubar.Portal>
						</Menubar.Sub>
					</Menubar.Content>
				</Menubar.Portal>
			</Menubar.Menu>
			{/** CNN */}
			{/** MODEL */}
			<Menubar.Menu>
				<Menubar.Trigger className='MenubarTrigger'>{t("models")}</Menubar.Trigger>
				<Menubar.Portal>
					<Menubar.Content
						className='MenubarContent'
						align='start'
						sideOffset={5}
						alignOffset={-14}
					>
						{Object.keys(availableModels).map(model => (
							<Menubar.CheckboxItem
								className='MenubarCheckboxItem inset'
								key={model}
								checked={selectedModels.includes(model)}
								onCheckedChange={() => handleModelCheckboxChange(model)}
							>
								<Menubar.ItemIndicator className='MenubarItemIndicator'>
									<CheckIcon />
								</Menubar.ItemIndicator>
								{model}
							</Menubar.CheckboxItem>
						))}
						<Menubar.Separator className='MenubarSeparator' />
						<Menubar.Item className='MenubarItem inset'
							onClick={() => {
								const fileInput = document.getElementById('modelInput') as HTMLInputElement;
								if (fileInput) {
									fileInput.click(); // Programmatically trigger the file input
								}
							}}
						>
							{t("uploadModel")}
						</Menubar.Item>
					</Menubar.Content>
				</Menubar.Portal>
			</Menubar.Menu>
			{/** CONFIG */}
			<Menubar.Menu>
				<Menubar.Trigger className='MenubarTrigger'>{t("config")}</Menubar.Trigger>
				<Menubar.Portal>
					<Menubar.Content
						className='MenubarContent'
						align='start'
						sideOffset={5}
						alignOffset={-14}
					>
						<Menubar.Sub>
							<Menubar.SubTrigger className='MenubarSubTrigger'>
								{t("classes")}
								<div className='RightSlot'>
									<ChevronRightIcon />
								</div>
							</Menubar.SubTrigger>
							<Menubar.Portal>
								<Menubar.SubContent
									className='MenubarSubContent'
									alignOffset={-5}
								>
									<Menubar.RadioGroup
										value={toolSystem?.getCurrentAnnotationClass()}
										onValueChange={(value) => toolSystem?.setCurrentAnnotationClass(value)}
									>
										{classItems.map((item) => (
											<Menubar.RadioItem
												className='MenubarRadioItem inset'
												key={item.id}
												value={item.name}
											>
												<Menubar.ItemIndicator className='MenubarItemIndicator'>
													<DotFilledIcon style={{ color: item.color }} />
												</Menubar.ItemIndicator>
												{item.name}
											</Menubar.RadioItem>
										))}
									</Menubar.RadioGroup>
									<Menubar.Separator className='MenubarSeparator' />
									<Menubar.Item
										className='MenubarItem'
										onClick={() => setIsClassesDialogOpen(true)}
									>
										{t("editClasses")}
									</Menubar.Item>
								</Menubar.SubContent>
							</Menubar.Portal>
						</Menubar.Sub>
					</Menubar.Content>
				</Menubar.Portal>
			</Menubar.Menu>
			<button
					className="MenubarButton"
					onClick={onPreprocess}
				>
				{t("preprocess")}
			</button>
			<div className='ml-auto flex items-center gap-2 mr-4'>

				{/** Language Dropdown */}
				<Menubar.Menu>
					<Menubar.Trigger className='MenubarTrigger flex items-center gap-2'>
						<GlobeIcon style={{ fontSize: 18 }} />
						{t("language")}
					</Menubar.Trigger>
					<Menubar.Portal>
						<Menubar.Content
							className='MenubarContent w-56'
							align='start'
							sideOffset={5}
							alignOffset={-14}
						>
							<Menubar.Item
								className='MenubarItem'
								onClick={() => i18n.changeLanguage("en")}
							>
								English
							</Menubar.Item>

							<Menubar.Item
								className='MenubarItem'
								onClick={() => i18n.changeLanguage("ja")}
							>
								日本語
							</Menubar.Item>
						</Menubar.Content>
					</Menubar.Portal>
				</Menubar.Menu>
			</div>

			{/* Dialog for Editing Classes */}
			<Dialog.Root open={isClassesDialogOpen} onOpenChange={setIsClassesDialogOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className='DialogOverlay' />
					<Dialog.Content className='DialogContent'>
						<Dialog.Title className='DialogTitle'>Configure Classes</Dialog.Title>
						<Dialog.Description className='DialogDescription'>
							Manage your class names configuration.
						</Dialog.Description>
						<div className='ClassesList'>
							{classItems.map((item) => (
								<div key={item.id} className='ClassItem'>
									<input
										type='text'
										value={item.name}
										onChange={(e) => updateClassName(item.id, e.target.value)}
										className='ClassInput'
										placeholder='Class name'
									/>
									<input
										type='color'
										value={item.color}
										onChange={(e) => updateClassColor(item.id, e.target.value)}
										className='ColorInput'
									/>
								</div>
							))}
						</div>
						<div className='DialogActions'>
							<Dialog.Close asChild>
								<button className='Button green' onClick={handleSaveClasses}>Save</button>
							</Dialog.Close>
							<Dialog.Close asChild>
								<button className='Button gray' onClick={handleCancelClasses}>Cancel</button>
							</Dialog.Close>
						</div>

						<Dialog.Close asChild>
							<button className='IconButton' aria-label='Close'>
								<Cross2Icon />
							</button>
						</Dialog.Close>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
			{/** Keep input outside of the Menubar popovers, since clicking removes it from the DOM :( */}
			<input
				id='imageInput'
				type='file'
				multiple
				accept='image/*'
				style={{ display: 'none' }}
				onChange={(e) => {
					const files = Array.from(e.currentTarget.files || []);
					// keep only images (file.type may be empty for some files from folders — fallback to extension)
					const imageFiles = files.filter(f =>
						(f.type && f.type.startsWith('image/')) ||
						/\.(jpe?g|png|gif|tiff|bmp|webp|svg)$/i.test(f.name)
					);

					if (imageFiles.length) {
						// convert back to a FileList using DataTransfer
						const dt = new DataTransfer();
						imageFiles.forEach(f => dt.items.add(f));
						setImageFiles(dt.files);
					} else {
						// clear / no images selected — pass empty FileList
						const dt = new DataTransfer();
						setImageFiles(dt.files);
					}
				}}
			/>
			<input
				id='modelInput'
				type='file'
				accept='.onnx'
				style={{ display: 'none' }}
				onChange={e => {
					if (e.target.files && e.target.files[0]) {
						onCustomModelUpload(e.target.files[0]);
					}
				}}
			/>
		</Menubar.Root>
	);
};

export default Filebar;
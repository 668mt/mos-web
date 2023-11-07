import Clipboard from "clipboard";

const copy = function (copyDom, getText, success, error) {
	let clipboard = new Clipboard(copyDom, {
		text: getText
	});
	clipboard.on('success', e => {
		success && success(e);
		clipboard.destroy()
	})
	clipboard.on('error', e => {
		error && error(e);
		clipboard.destroy()
	})
}

export {
	copy
}
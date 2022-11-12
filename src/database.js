import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
class Database {
	/**
	 * @param {string} dir
	 * @param {string} dataType
	 */
	constructor(dir, dataType) {
		this._dataType = dataType;
		this._content = dataType === 'array' ? [] : dataType === 'object' ? {} : undefined;
		this._path = resolve(dir);
		this._interval = undefined;
		this._saveNotifs = true;
	}
	/**
	 * @param {string | number} data
	 * @param {any} data1
	 */
	addData(data, data1) {
		if (this._dataType === 'array') {
			this._content.push(data);
		} else if (this._dataType === 'object') {
			this._content[data] = data1;
		}
		return this;
	}
	/**
	 * @param {string | number} key
	 */
	removeData(key) {
		if (this._dataType === 'array') {
			this._content.splice(key, 1);
		} else if (this._dataType === 'object') {
			delete this._content[key];
		}
		return this;
	}
	initLoad() {
		const json = readFileSync(this._path);
		// @ts-ignore
		const array = JSON.parse(json);
		this._content = array;
		console.log(this._path + ' Database Loaded');
		return this;
	}
	forceSave(db = this, force = false) {
		const oldJson = readFileSync(db._path, { encoding: 'utf8' });
		const newJson = JSON.stringify(db._content);
		if (oldJson !== newJson || force) {
			writeFileSync(db._path, newJson);
			if (this._saveNotifs) console.log(this._path + ' Database Saved');
		}
		return db;
	}
	/**
	 * @param {any} milliseconds
	 */
	intervalSave(milliseconds) {
		this._interval = setInterval(() => this.forceSave(this), milliseconds || 60000);
		return this;
	}
	stopInterval() {
		if (this._interval) clearInterval(this._interval);
		return this;
	}
	disableSaveNotifs() {
		this._saveNotifs = false;
		console.log(this._path + ' "Database Saved" Notifications Disabled');
		return this;
	}
}
export default Database;
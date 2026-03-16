const Job = require("../models/Job");
const parseVErr = require("../utils/parseValidationErrs");

const getAllJobs = async (req, res) => {
	const jobs = await Job.find({ createdBy: req.user._id });
	res.render("jobs", { jobs });
};

const showNewForm = (req, res) => {
	res.render("job", { job: null });
};

const createJob = async (req, res, next) => {
	try {
		await Job.create({
			...req.body,
			createdBy: req.user._id,
		});
		req.flash("info", "Job created.");
		res.redirect("/jobs");
	} catch (e) {
		if (e.name === "ValidationError") {
			parseVErr(e, req);
			return res.render("job", { job: null });
		}
		next(e);
	}
};

const showEditForm = async (req, res, next) => {
	const job = await Job.findOne({
		_id: req.params.id,
		createdBy: req.user._id,
	});

	if (!job) {
		req.flash("error", "Job not found.");
		return res.redirect("/jobs");
	}

	res.render("job", { job });
};

const updateJob = async (req, res, next) => {
	try {
		const job = await Job.findOneAndUpdate(
			{ _id: req.params.id, createdBy: req.user._id },
			req.body,
			{ new: true, runValidators: true },
		);

		if (!job) {
			req.flash("error", "Job not found.");
			return res.redirect("/jobs");
		}

		req.flash("info", "Job updated.");
		res.redirect("/jobs");
	} catch (e) {
		if (e.name === "ValidationError") {
			parseVErr(e, req);
			const job = await Job.findById(req.params.id);
			return res.render("job", { job });
		}
		next(e);
	}
};

const deleteJob = async (req, res) => {
	await Job.findOneAndDelete({
		_id: req.params.id,
		createdBy: req.user._id,
	});
	req.flash("info", "Job deleted.");
	res.redirect("/jobs");
};

module.exports = {
	getAllJobs,
	showNewForm,
	createJob,
	showEditForm,
	updateJob,
	deleteJob,
};
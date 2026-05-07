const teamService = require("../../services/team.service");
const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");

exports.createTeam = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.logo = await uploadToFirebase(req.file, "teams");
    }
    const team = await teamService.createTeam(data);

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const result = await teamService.getTeams(req.query);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSingleTeam = async (req, res) => {
  try {
    const team = await teamService.getById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      const existing = await teamService.getById(req.params.id);
      if (existing?.logo) {
        try { await deleteFromFirebase(existing.logo); } catch (e) {}
      }
      data.logo = await uploadToFirebase(req.file, "teams");
    }

    const team = await teamService.updateTeam(
      req.params.id,
      data
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.json({
      success: true,
      message: "Team updated successfully",
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const teamExists = await teamService.getById(req.params.id);

    if (!teamExists) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    if (teamExists.logo) {
      try { await deleteFromFirebase(teamExists.logo); } catch (e) {}
    }

    const team = await teamService.deleteTeam(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.json({
      success: true,
      message: "Team deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const team = await teamService.toggleStatus(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.json({
      success: true,
      message: "Status updated",
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

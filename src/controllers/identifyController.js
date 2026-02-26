import { identifyContact } from "../services/identifyService.js";

// Validates the request body and delegates reconciliation logic to the service layer
const identify = async (req, res) => {
	try {
		const { email, phoneNumber } = req.body;

		// Treat empty strings the same as missing — both fields absent is invalid
		const hasEmail = email !== undefined && email !== null && email !== "";
		const hasPhone = phoneNumber !== undefined && phoneNumber !== null && phoneNumber !== "";



		// At least one identifier must be provided per the spec
		if (!hasEmail && !hasPhone) {
			return res.status(400).json({ error: "At least one of email or phoneNumber is required." });
		}



		// Pass normalised values (absent field → null) to the service
		const result = await identifyContact({
			email: hasEmail ? email : null,
			phoneNumber: hasPhone ? phoneNumber : null,
		});


		// Return the consolidated contact in the shape defined by the spec
		return res.status(200).json(result);
	} catch (err) {
		console.error("Identify error:", err);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export { identify };

import { Op } from "sequelize";
import Contact from "../models/Contact.js";

const identifyContact = async ({ email, phoneNumber }) => {
	// Normalise: phoneNumber may arrive as a number from the request body
	const phone = phoneNumber != null ? String(phoneNumber) : null;
	const mail = email || null;

	// 1. Find all contacts matching email or phoneNumber
	const orConditions = [];
	if (mail) orConditions.push({ email: mail });
	if (phone) orConditions.push({ phoneNumber: phone });

	const matchedContacts = await Contact.findAll({
		where: { [Op.or]: orConditions, deletedAt: null },
	});

	// 2. No existing contact → create new primary
	if (matchedContacts.length === 0) {
		const newContact = await Contact.create({
			email: mail,
			phoneNumber: phone,
			linkPrecedence: "primary",
		});
		return buildResponse([newContact], newContact.id);
	}

	// 3. Gather all root primary IDs from matched contacts
	const primaryIds = new Set();
	for (const c of matchedContacts) {
		if (c.linkPrecedence === "primary") {
			primaryIds.add(c.id);
		} else if (c.linkedId) {
			primaryIds.add(c.linkedId);
		}
	}

	// Fetch every contact belonging to any of these primary chains
	const allRelated = await Contact.findAll({
		where: {
			[Op.or]: [
				{ id: { [Op.in]: [...primaryIds] } },
				{ linkedId: { [Op.in]: [...primaryIds] } },
			],
			deletedAt: null,
		},
	});

	// 4. Determine the oldest primary (it stays primary)
	const primaries = allRelated.filter((c) => c.linkPrecedence === "primary");
	primaries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
	const oldestPrimary = primaries[0];
	const newerPrimaries = primaries.slice(1);

	// 5. Demote newer primaries → secondary, AND relink their existing
	//    secondaries to the oldest primary so no contacts are orphaned
	if (newerPrimaries.length > 0) {
		const newerPrimaryIds = newerPrimaries.map((p) => p.id);

		// Relink existing secondaries of the newer primaries
		await Contact.update(
			{ linkedId: oldestPrimary.id },
			{ where: { linkedId: { [Op.in]: newerPrimaryIds }, deletedAt: null } }
		);

		// Demote the newer primaries themselves
		await Contact.update(
			{ linkPrecedence: "secondary", linkedId: oldestPrimary.id },
			{ where: { id: { [Op.in]: newerPrimaryIds } } }
		);
	}

	// 6. Re-fetch all contacts under the oldest primary
	const finalContacts = await Contact.findAll({
		where: {
			[Op.or]: [
				{ id: oldestPrimary.id },
				{ linkedId: oldestPrimary.id },
			],
			deletedAt: null,
		},
	});

	// 7. If the incoming request carries new information, create a secondary
	const existingEmails = new Set(finalContacts.map((c) => c.email).filter(Boolean));
	const existingPhones = new Set(finalContacts.map((c) => c.phoneNumber).filter(Boolean));

	const isNewEmail = mail && !existingEmails.has(mail);
	const isNewPhone = phone && !existingPhones.has(phone);

	if (isNewEmail || isNewPhone) {
		await Contact.create({
			email: mail,
			phoneNumber: phone,
			linkedId: oldestPrimary.id,
			linkPrecedence: "secondary",
		});

		const updatedContacts = await Contact.findAll({
			where: {
				[Op.or]: [
					{ id: oldestPrimary.id },
					{ linkedId: oldestPrimary.id },
				],
				deletedAt: null,
			},
		});

		return buildResponse(updatedContacts, oldestPrimary.id);
	}

	return buildResponse(finalContacts, oldestPrimary.id);
};

// NOTE: "primaryContatctId" matches the exact (typo'd) key in the Bitespeed spec
const buildResponse = (contacts, primaryId) => {
	const primary = contacts.find((c) => c.id === primaryId);
	const secondaries = contacts.filter((c) => c.id !== primaryId);

	const emails = [
		...(primary?.email ? [primary.email] : []),
		...secondaries.map((c) => c.email).filter(Boolean),
	];

	const phoneNumbers = [
		...(primary?.phoneNumber ? [primary.phoneNumber] : []),
		...secondaries.map((c) => c.phoneNumber).filter(Boolean),
	];

	return {
		contact: {
			primaryContatctId: primaryId,
			emails: [...new Set(emails)],
			phoneNumbers: [...new Set(phoneNumbers)],
			secondaryContactIds: secondaries.map((c) => c.id),
		},
	};
};

export { identifyContact };

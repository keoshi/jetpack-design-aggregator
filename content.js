chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "aggregate") {
		const aggregatedData = aggregateData();
		const formattedData = formatDataForMarkdown(aggregatedData);
		copyToClipboard(formattedData);
		
		// Perform your action here
		sendResponse({status: "success", aggregatedData: aggregatedData, formattedData: formattedData});
	}
});

function aggregateData() {
	const data = {
		url: window.location.href,
		timestamp: new Date().toISOString(),
		snaps: [],
		others: [],
		authors: new Set()
	};

	const authorWhitelist = [
		'ballio2000',
		'cbusquets1989', 
		'ederrengifo',
		'eeeeevon',
		'ilonagl',
		'keoshi',
		'noamalmos', 
		'sanjagrbic'
	];
	
	const posts = document.querySelectorAll('.o2-posts article');
	const twoWeeksAgo = new Date();
	twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
	
	// Iterate through each post on the page
	posts.forEach(post => {
		if (post.classList.contains('sticky')) return; // Ignore sticky posts
		
		let postData = {};
		let postDate;
		let author;
		
		if (post.classList.contains('tag-p2-xpost')) {
			// Process xpost posts
			const dateElement = post.querySelector('.o2-xpost-author');
			if (!dateElement) return;
			
			postDate = new Date(dateElement.textContent.trim());
			
			const contentElement = post.querySelector('.o2-xpost-content');
			if (!contentElement) return;
			
			const links = contentElement.querySelectorAll('a');
			if (links.length < 2) return;
			
			const title = links[1].textContent.trim();
			const href = links[1].href;
			postData.markdownLink = `[${title}](${href})`;
			
		} else {
			// Process non-xpost posts
			const headerContent = post.querySelector('.entry-header__content');
			if (!headerContent) return;
			
			const titleLink = headerContent.querySelector('a');
			if (!titleLink) return;
			
			const title = titleLink.textContent.trim();
			const href = titleLink.href;
			postData.markdownLink = `[${title}](${href})`;
			
			const metaElement = headerContent.querySelector('.entry-meta');
			if (metaElement) {
				const dateElement = metaElement.querySelector('.entry-meta-secondary a');
				if (dateElement) {
					const preprocessedDateString = dateElement.textContent.trim().replace(" on ", " ");
					postDate = new Date( preprocessedDateString );
				}
			}
		}
		
		// Skip posts older than two weeks
		if (!postDate || postDate < twoWeeksAgo) return;
		
		// Process author
		const authorClass = Array.from(post.classList).find(cls => cls.startsWith('author-'));
		if (authorClass) {
			author = authorClass.replace('author-', '');
		}
		
		if (author && authorWhitelist.includes(author)) {
			data.authors.add(author);
			postData.author = author;
			
			// Add to appropriate array
			if (post.classList.contains('tag-p2-xpost')) {
				data.snaps.push(postData);
			} else {
				data.others.push(postData);
			}
		}
	});
	
	// Convert Set to Array for easier handling
	data.authors = Array.from(data.authors);
	
	return data;
}

// Format the data for Markdown
function formatDataForMarkdown(data) {
	let output = `## Design Posts from ${data.url}\n`;
	output += `Generated on: ${data.timestamp}\n\n`;
	
	output += "### Snaps\n";
	data.snaps.forEach(snap => {
		output += `- ${snap.markdownLink}${snap.author ? ` (by ${snap.author})` : ''}\n`;
	});
	
	output += "\n### Others\n";
	data.others.forEach(other => {
		output += `- ${other.markdownLink}${other.author ? ` (by ${other.author})` : ''}\n`;
	});
	
	output += "\n### Authors\n";
	data.authors.forEach(author => {
		output += `- ${author}\n`;
	});
	
	return output;
}

function showPopover(message, isSuccess = true) {
	// Remove any existing popover
	const existingPopover = document.getElementById('copyNotificationPopover');
	if (existingPopover) {
		existingPopover.remove();
	}
	
	// Create popover element
	const popover = document.createElement('div');
	popover.id = 'copyNotificationPopover';
	popover.style.cssText = `
		position: fixed;
		top: 48px;
		right: 24px;
		padding: 10px 20px;
		background-color: ${isSuccess ? '#003010' : '#F44336'};
		color: #48FF50;
		border-radius: 5px;
		font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial, sans-serif;
		font-size: 14px;
		font-weight: 500;
		z-index: 9999999;
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	`;
	popover.textContent = message;
	
	// Add popover to body
	document.body.appendChild(popover);
	
	// Trigger fade in
	setTimeout(() => {
		popover.style.opacity = '1';
	}, 10);
	
	// Remove popover after 3 seconds
	setTimeout(() => {
		popover.style.opacity = '0';
		setTimeout(() => {
			popover.remove();
		}, 300);
	}, 3000);
}

// Copy posts to clipboard
async function copyToClipboard(text) {
	console.log(text);
	try {
		await navigator.clipboard.writeText(text);
		showPopover("Copied posts to clipboard!", true);
	} catch (err) {
		console.error('Failed to copy text: ', err);
		showPopover("Failed to copy posts to clipboard.", false);
	}
}
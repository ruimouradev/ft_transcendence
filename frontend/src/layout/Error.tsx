import { Link } from 'react-router';

function Error()
{
	return (
		<div className="error">
			<h1>404 Not Found</h1>
			<h3>Not sure what you were looking for, but it's not here.</h3>
			<Link to='/'>Back to Home</Link>
		</div>
	);
}

export default Error
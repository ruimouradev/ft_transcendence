import {useState} from 'react'
interface HelloWorldProps {
	title: string;
	render?:(count:number)=>React.ReactNode;
}

export const HelloWorld=(props: HelloWorldProps)=>{
	const {title,render}=props;
	const [count,setCount]=useState(0);
	return (<div>
				Hello World! {title}--{count}
				<button onClick={()=>setCount(count+1)}>+</button>
				{render?.(count)}
			</div>);
}
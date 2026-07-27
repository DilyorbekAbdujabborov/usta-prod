import { SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorPage from './ErrorPage';

export default function NotFoundPage() {
	const navigate = useNavigate();
	return (
		<ErrorPage
			code="404"
			icon={SearchX}
			title="Sahifa topilmadi"
			message="Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin."
			onAction={() => navigate('/')}
		/>
	);
}

import { useParams } from 'react-router-dom'
import TitleEditorForm from '../components/TitleEditorForm'

export default function EditPage({ token }) {
    const { id } = useParams()

    return <TitleEditorForm token={token} titleId={id} />
}

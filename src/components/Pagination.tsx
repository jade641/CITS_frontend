import type { PaginatedResponse } from '../interfaces'

export function Pagination<T>({
  pagination,
  onPageChange,
}: {
  pagination: PaginatedResponse<T>
  onPageChange: (page: number) => void
}) {
  if (pagination.last_page <= 1) {
    return null
  }

  const startPage = Math.max(1, pagination.current_page - 2)
  const endPage = Math.min(pagination.last_page, pagination.current_page + 2)
  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  )

  return (
    <nav aria-label="Pagination">
      <ul className="pagination mb-0">
        <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
          >
            Previous
          </button>
        </li>
        {pages.map((pageNumber) => (
          <li
            key={pageNumber}
            className={`page-item ${pageNumber === pagination.current_page ? 'active' : ''}`}
          >
            <button type="button" className="page-link" onClick={() => onPageChange(pageNumber)}>
              {pageNumber}
            </button>
          </li>
        ))}
        <li
          className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}
        >
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.last_page}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  )
}
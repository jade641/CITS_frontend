import type { PaginatedResponse } from '../interfaces'

interface PaginationControlsProps<T> {
  page: PaginatedResponse<T>
  onPageChange: (page: number) => void
}

export function PaginationControls<T>({ page, onPageChange }: PaginationControlsProps<T>) {
  if (page.last_page <= 1) {
    return null
  }

  return (
    <nav aria-label="Pagination">
      <ul className="pagination cits-pagination justify-content-end mb-0">
        <li className={`page-item ${!page.prev_page_url ? 'disabled' : ''}`}>
          <button
            className="page-link cits-pagination__link"
            onClick={() => onPageChange(page.current_page - 1)}
            type="button"
            disabled={!page.prev_page_url}
          >
            Previous
          </button>
        </li>
        {Array.from({ length: page.last_page }, (_, index) => index + 1)
          .filter((item) => Math.abs(item - page.current_page) <= 2 || item === 1 || item === page.last_page)
          .map((item) => (
            <li key={item} className={`page-item ${item === page.current_page ? 'active' : ''}`}>
              <button className="page-link cits-pagination__link" onClick={() => onPageChange(item)} type="button">
                {item}
              </button>
            </li>
          ))}
        <li className={`page-item ${!page.next_page_url ? 'disabled' : ''}`}>
          <button
            className="page-link cits-pagination__link"
            onClick={() => onPageChange(page.current_page + 1)}
            type="button"
            disabled={!page.next_page_url}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  )
}